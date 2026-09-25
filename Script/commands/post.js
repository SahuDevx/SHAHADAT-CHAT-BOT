const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "post",
    version: "2.0.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Create a Facebook post with caption and optional photo",
    commandCategory: "Facebook Post",
    usages: "[caption] or reply to a photo with /post [caption]",
    cooldowns: 0,
    usePrefix: true
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;

    try {
        const caption = args.join(" ").trim();
        let photo = null;

        if (
            event.type === "message_reply" &&
            event.messageReply.attachments &&
            event.messageReply.attachments.length
        ) {
            const attachment = event.messageReply.attachments.find(
                item => item.type === "photo" && item.url
            );

            if (attachment) {
                photo = attachment;
            }
        }

        if (!caption && !photo) {
            return api.sendMessage(
                "📝 Post korar jonno caption din othoba kono photo-te reply korun!",
                threadID,
                messageID
            );
        }

        const uuid = getGUID();

        const formData = {
            input: {
                composer_entry_point: "inline_composer",
                composer_source_surface: "timeline",
                idempotence_token: uuid + "_FEED",
                source: "WWW",
                attachments: [],
                audience: {
                    privacy: {
                        allow: [],
                        base_state: "FRIENDS",
                        deny: [],
                        tag_expansion_state: "UNSPECIFIED"
                    }
                },
                message: {
                    ranges: [],
                    text: caption
                },
                with_tags_ids: [],
                inline_activities: [],
                explicit_place_id: "0",
                text_format_preset_id: "0",
                logging: {
                    composer_session_id: uuid
                },
                tracking: [null],
                actor_id: api.getCurrentUserID(),
                client_mutation_id: Math.floor(Math.random() * 17)
            },
            displayCommentsFeedbackContext: null,
            displayCommentsContextEnableComment: null,
            displayCommentsContextIsAdPreview: null,
            displayCommentsContextIsAggregatedShare: null,
            displayCommentsContextIsStorySet: null,
            feedLocation: "TIMELINE",
            feedbackSource: 0,
            focusCommentID: null,
            gridMediaWidth: 230,
            groupID: null,
            scale: 3,
            privacySelectorRenderLocation: "COMET_STREAM",
            renderLocation: "timeline",
            useDefaultActor: false,
            inviteShortLinkKey: null,
            isFeed: false,
            isFundraiser: false,
            isFunFactPost: false,
            isGroup: false,
            isTimeline: true,
            isSocialLearning: false,
            isPageNewsFeed: false,
            isProfileReviews: false,
            isWorkSharedDraft: false,
            UFI2CommentsProvider_commentsKey: "ProfileCometTimelineRoute",
            hashtag: null,
            canUserManageOffers: false
        };

    if (photo) {
        const cacheDir = path.join(__dirname, "cache");
        await fs.ensureDir(cacheDir);

        const imagePath = path.join(
            cacheDir,
            `post_${Date.now()}.jpg`
        );

        const response = await axios.get(photo.url, {
            responseType: "arraybuffer",
            timeout: 30000
        });

        await fs.writeFile(
            imagePath,
            Buffer.from(response.data)
        );

        const botID = api.getCurrentUserID();

        const uploadResult = await new Promise((resolve, reject) => {
            api.httpPostFormData(
                `https://www.facebook.com/profile/picture/upload/?profile_id=${botID}&photo_source=57&av=${botID}`,
                {
                    file: fs.createReadStream(imagePath)
                },
                (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                }
            );
        });

        try {
            await fs.remove(imagePath);
        } catch (e) {}

        let result = uploadResult;

        if (typeof result === "string") {
            result = JSON.parse(
                result.replace("for (;;);", "")
            );
        }

        if (
            !result ||
            !result.payload ||
            !result.payload.fbid
        ) {
            throw new Error("Photo upload failed");
        }

        formData.input.attachments.push({
            photo: {
                id: result.payload.fbid.toString()
            }
        });
    }

    return api.sendMessage(
        "Choose who can see this post\n\n" +
        "1. Public\n" +
        "2. Friends\n" +
        "3. Only me",
        threadID,
        (err, info) => {
            if (err || !info) return;

            global.client.handleReply =
                global.client.handleReply || [];

            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                threadID,
                formData,
                type: "audience"
            });
        },
        messageID
    );
    } catch (error) {
        console.error("[POST ERROR]:", error);

        return api.sendMessage(
            "❌ Post creation failed, please try again later.",
            threadID,
            messageID
        );
    }
};

module.exports.handleReply = async function ({
    api,
    event,
    handleReply
}) {
    if (!handleReply) return;

    if (event.senderID !== handleReply.author) {
        return;
    }

    if (handleReply.type !== "audience") {
        return;
    }

    const choice = String(event.body || "").trim();

    if (!["1", "2", "3"].includes(choice)) {
        return api.sendMessage(
            "⚠️ Please choose 1, 2 or 3.",
            event.threadID,
            event.messageID
        );
    }

    try {
        handleReply.formData.input.audience.privacy.base_state =
            choice === "1"
                ? "EVERYONE"
                : choice === "2"
                    ? "FRIENDS"
                    : "SELF";

        api.unsendMessage(
            handleReply.messageID,
            () => {}
        );

        const waitMsg = await new Promise(resolve => {
            api.sendMessage(
                "⏳ Facebook timeline-e post publish kora hocche...",
                event.threadID,
                (err, info) => resolve(info || null)
            );
        });

        const botID = api.getCurrentUserID();

        const form = {
            av: botID,
            fb_api_req_friendly_name:
                "ComposerStoryCreateMutation",
            fb_api_caller_class: "RelayModern",
            doc_id: "7711610262190099",
            variables: JSON.stringify(
                handleReply.formData
            )
        };

        const story = await new Promise((resolve, reject) => {
            api.httpPost(
                "https://www.facebook.com/api/graphql/",
                form,
                (err, info) => {
                    if (err) return reject(err);

                    try {
                        if (typeof info === "string") {
                            info = JSON.parse(
                                info.replace("for (;;);", "")
                            );
                        }

                        if (info.errors) {
                            return reject(
                                new Error(
                                    "Facebook post creation failed"
                                )
                            );
                        }

                        const result =
                            info?.data?.story_create?.story;

                        if (!result) {
                            return reject(
                                new Error(
                                    "Invalid Facebook response"
                                )
                            );
                        }

                        resolve(result);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });

        if (
            waitMsg &&
            waitMsg.messageID &&
            typeof api.unsendMessage === "function"
        ) {
            await new Promise(resolve => {
                api.unsendMessage(
                    waitMsg.messageID,
                    () => resolve()
                );
            });
        }

        const postID =
            story.legacy_story_hideable_id;

        const postURL =
            story.url;

        return api.sendMessage(
            "✅ Post created successfully!\n\n" +
            `🆔 Post ID: ${postID || "N/A"}\n` +
            `🔗 Post Link: ${postURL || "N/A"}`,
            event.threadID,
            event.messageID
        );

    } catch (error) {
        console.error("[POST ERROR]:", error);

        return api.sendMessage(
            "❌ Post creation failed, please try again later.",
            event.threadID,
            event.messageID
        );
    }
};

function getGUID() {
    let sectionLength = Date.now();

    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        function (c) {
            const r = Math.floor(
                (sectionLength + Math.random() * 16) % 16
            );

            sectionLength = Math.floor(
                sectionLength / 16
            );

            return (
                c === "x"
                    ? r
                    : (r & 7) | 8
            ).toString(16);
        }
    );
}
