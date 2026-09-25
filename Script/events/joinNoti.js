const axios = require("axios");
const {
    createCanvas,
    loadImage,
    registerFont
} = require("canvas");
const fs = require("fs-extra");
const path = require("path");

const FACEBOOK_ACCESS_TOKEN =
    "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports.config = {
    name: "joinNoti",
    eventType: ["log:subscribe"],
    version: "2.7.0",
    credits: "SHAHADAT SAHU",
    description: "Bot join notification with Canvas banner",
    dependencies: {
        axios: "",
        canvas: "",
        "fs-extra": "",
        path: ""
    }
};

const CACHE_DIR = path.join(
    __dirname,
    "cache"
);

const FONT_PATH = path.join(
    CACHE_DIR,
    "NotoSansBengali-Bold.ttf"
);

// 😊 দুঃখিত, এখানে কোনো Edit করতে হবে না।
// 🔄 নতুন Update-এর পর Bot Name Automatically Load হবে।
// ✅ তাই কোনো Setup-এর প্রয়োজন নেই।

async function loadFont() {
    try {
        await fs.ensureDir(
            CACHE_DIR
        );

        if (!fs.existsSync(FONT_PATH)) {
            const fontURL =
                "https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Bold.ttf";

            const response =
                await axios.get(
                    fontURL,
                    {
                        responseType:
                            "arraybuffer",
                        timeout:
                            20000
                    }
                );
// 🥲 দুঃখিত, নতুন Update-এর পর
// 59, 60, 61, 64 পরিবর্তন করে নিচের
// 1219, 1220, 1222, 1225-এ গিয়ে খুঁজুন।
// ✅ সেখানেই সব Information পেয়ে যাবেন।

            await fs.writeFile(
                FONT_PATH,
                Buffer.from(
                    response.data
                )
            );
        }

        try {
            registerFont(
                FONT_PATH,
                {
                    family:
                        "SahuBengali"
                }
            );
        } catch (e) {}

    } catch (error) {
        console.error(
            "[JOINNOTI FONT ERROR]:",
            error.message
        );
    }
}

function font(
    size,
    weight = "normal"
) {
    return `${weight} ${size}px SahuBengali, Arial, sans-serif`;
}

function fitText(
    ctx,
    text,
    maxWidth,
    startSize,
    weight = "bold"
) {
    let size =
        startSize;

    while (size > 16) {
        ctx.font =
            font(
                size,
                weight
            );

        if (
            ctx.measureText(
                text
            ).width <=
            maxWidth
        ) {
            break;
        }

        size -= 2;
    }

    ctx.font =
        font(
            size,
            weight
        );

    return size;
}

function getUserInfo(
    api,
    userID
) {
    return new Promise(
        (
            resolve,
            reject
        ) => {
            api.getUserInfo(
                userID,
                (
                    err,
                    data
                ) => {
                    if (err) {
                        reject(
                            err
                        );
                        return;
                    }

                    resolve(
                        data
                    );
                }
            );
        }
    );
}

async function getAddedUser(
    api,
    userID
) {
    let name =
        "Unknown User";

    try {
        const info =
            await getUserInfo(
                api,
                userID
            );

        const user =
            info &&
            info[userID];

        if (
            user &&
            user.name
        ) {
            name =
                String(
                    user.name
                );
        }
    } catch (
        error
    ) {}

    return {
        name
    };
}

async function loadProfileImage(
    userID
) {
    if (!userID) {
        return null;
    }

    try {
        const photoURL =
            `https://graph.facebook.com/${userID}/picture?width=512&height=512&type=large&access_token=${encodeURIComponent(
                FACEBOOK_ACCESS_TOKEN
            )}`;

        const response =
            await axios.get(
                photoURL,
                {
                    responseType:
                        "arraybuffer",
                    timeout:
                        20000,
                    maxRedirects:
                        5,
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0"
                    }
                }
            );

        if (
            !response.data ||
            response.data.length <
                1000
        ) {
            return null;
        }

        return await loadImage(
            Buffer.from(
                response.data
            )
        );

    } catch (
        error
    ) {
        console.error(
            "[PROFILE IMAGE ERROR]:",
            error.message
        );

        return null;
    }
}

function drawChatIcon(
    ctx,
    x,
    y,
    radius
) {
    ctx.save();

    ctx.fillStyle =
        "#111111";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.roundRect(
        x -
            radius *
                0.48,
        y -
            radius *
                0.32,
        radius *
            0.96,
        radius *
            0.62,
        10
    );

    ctx.fill();

    ctx.beginPath();

    ctx.moveTo(
        x -
            radius *
                0.18,
        y +
            radius *
                0.28
    );

    ctx.lineTo(
        x -
            radius *
                0.02,
        y +
            radius *
                0.58
    );

    ctx.lineTo(
        x +
            radius *
                0.10,
        y +
            radius *
                0.28
    );

    ctx.closePath();

    ctx.fill();

    ctx.fillStyle =
        "#111111";

    for (
        let i = -1;
        i <= 1;
        i++
    ) {
        ctx.beginPath();

        ctx.arc(
            x +
                i *
                    radius *
                    0.23,
            y -
                radius *
                    0.01,
            radius *
                0.06,
            0,
            Math.PI * 2
        );

        ctx.fill();
    }

    ctx.restore();
}

function drawInfoIcon(
    ctx,
    x,
    y,
    radius
) {
    ctx.save();

    ctx.fillStyle =
        "#111111";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        `bold ${
            radius * 1.15
        }px Arial`;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    ctx.fillText(
        "i",
        x,
        y + 2
    );

    ctx.restore();
}

function drawUserIcon(
    ctx,
    x,
    y,
    radius
) {
    ctx.save();

    ctx.fillStyle =
        "#111111";

    ctx.beginPath();

    ctx.arc(
        x,
        y,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.fillStyle =
        "#ffffff";

    ctx.beginPath();

    ctx.arc(
        x,
        y -
            radius *
                0.22,
        radius *
            0.22,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.beginPath();

    ctx.arc(
        x,
        y +
            radius *
                0.30,
        radius *
            0.37,
        0,
        Math.PI
    );

    ctx.fill();

    ctx.restore();
}

async function createBotJoinBanner(
    botName,
    addedByID,
    addedByName
) {
    await loadFont();

    const WIDTH =
        1536;

    const HEIGHT =
        1024;

    const canvas =
        createCanvas(
            WIDTH,
            HEIGHT
        );

    const ctx =
        canvas.getContext(
            "2d"
        );

    ctx.fillStyle =
        "#ffffff";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );

    const centerX =
        WIDTH / 2;

    const leftBox = {
        x: 110,
        y: 410,
        w: 670,
        h: 420
    };

    const rightBox = {
        x: 850,
        y: 410,
        w: 575,
        h: 420
    };

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";

    let displayBotName =
        String(
            botName ||
                "SHAHADAT CHAT BOT"
        ).trim();

    if (
        displayBotName.length >
        60
    ) {
        displayBotName =
            displayBotName.substring(
                0,
                57
            ) +
            "...";
    }

    fitText(
        ctx,
        displayBotName,
        WIDTH - 180,
        74,
        "bold"
    );

    ctx.fillStyle =
        "#111111";

    ctx.fillText(
        displayBotName,
        centerX,
        85
    );

    ctx.strokeStyle =
        "#2456c4";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        430,
        150
    );

    ctx.lineTo(
        690,
        150
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        846,
        150
    );

    ctx.lineTo(
        1106,
        150
    );

    ctx.stroke();

    ctx.fillStyle =
        "#2456c4";

    ctx.font =
        "34px Arial";

    ctx.fillText(
        "✦",
        centerX,
        150
    );

    ctx.fillStyle =
        "#111111";

    ctx.font =
        font(
            46,
            "bold"
        );

    ctx.fillText(
        "THANK YOU SO MUCH",
        centerX,
        215
    );

    const groupText =
        "♥ FOR ADDING ME TO YOUR GROUP ♥";

    ctx.fillStyle =
        "#2456c4";

    fitText(
        ctx,
        groupText,
        WIDTH - 170,
        56,
        "bold"
    );

    ctx.fillText(
        groupText,
        centerX,
        285
    );

    ctx.strokeStyle =
        "#c7c7c7";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.roundRect(
        leftBox.x,
        leftBox.y,
        leftBox.w,
        leftBox.h,
        18
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.roundRect(
        rightBox.x,
        rightBox.y,
        rightBox.w,
        rightBox.h,
        18
    );

    ctx.stroke();

    ctx.fillStyle =
        "#111111";

    ctx.font =
        font(
            34,
            "bold"
        );

    ctx.textAlign =
        "center";

    ctx.fillText(
        "TO VIEW ANY COMMAND",
        leftBox.x +
            leftBox.w /
                2,
        leftBox.y + 58
    );

    ctx.fillText(
        "ADDED BY",
        rightBox.x +
            rightBox.w /
                2,
        rightBox.y + 58
    );

    const prefix =
        String(
            global.config.PREFIX ||
                "/"
        );

    const iconX =
        leftBox.x + 88;

    const textX =
        leftBox.x + 165;

    const rows = [
        {
            y:
                leftBox.y +
                140,
            type:
                "chat",
            text:
                `${prefix}help`
        },
        {
            y:
                leftBox.y +
                245,
            type:
                "info",
            text:
                `${prefix}info`
        },
        {
            y:
                leftBox.y +
                350,
            type:
                "user",
            text:
                `${prefix}admin`
        }
    ];

    for (
        let i = 0;
        i < rows.length;
        i++
    ) {
        const row =
            rows[i];

        if (
            row.type ===
            "chat"
        ) {
            drawChatIcon(
                ctx,
                iconX,
                row.y,
                45
            );
        }

        if (
            row.type ===
            "info"
        ) {
            drawInfoIcon(
                ctx,
                iconX,
                row.y,
                45
            );
        }

        if (
            row.type ===
            "user"
        ) {
            drawUserIcon(
                ctx,
                iconX,
                row.y,
                45
            );
        }

        ctx.textAlign =
            "left";

        ctx.font =
            font(32);

        ctx.fillStyle =
            "#111111";

        ctx.fillText(
            row.text,
            textX,
            row.y
        );

        if (
            i <
            rows.length - 1
        ) {
            ctx.strokeStyle =
                "#dddddd";

            ctx.lineWidth =
                2;

            ctx.beginPath();

            ctx.moveTo(
                leftBox.x + 45,
                row.y + 58
            );

            ctx.lineTo(
                leftBox.x +
                    leftBox.w -
                    45,
                row.y + 58
            );

            ctx.stroke();
        }
    }

    const photoX =
        rightBox.x +
        rightBox.w /
            2;

    const photoY =
        rightBox.y + 185;

    const photoRadius =
        82;

    const profileImage =
        await loadProfileImage(
            addedByID
        );

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        photoX,
        photoY,
        photoRadius + 7,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.fill();

    ctx.strokeStyle =
        "#2456c4";

    ctx.lineWidth = 4;

    ctx.stroke();

    ctx.beginPath();

    ctx.arc(
        photoX,
        photoY,
        photoRadius,
        0,
        Math.PI * 2
    );

    ctx.clip();

    if (
        profileImage
    ) {
        const iw =
            profileImage.width;

        const ih =
            profileImage.height;

        const diameter =
            photoRadius * 2;

        const scale =
            Math.max(
                diameter / iw,
                diameter / ih
            );

        const dw =
            iw * scale;

        const dh =
            ih * scale;

        ctx.imageSmoothingEnabled =
            true;

        ctx.imageSmoothingQuality =
            "high";

        ctx.drawImage(
            profileImage,
            photoX -
                dw / 2,
            photoY -
                dh / 2,
            dw,
            dh
        );

    } else {
        ctx.fillStyle =
            "#eeeeee";

        ctx.fill();

        drawUserIcon(
            ctx,
            photoX,
            photoY,
            45
        );
    }

    ctx.restore();

    let displayAddedBy =
        String(
            addedByName ||
                "Unknown User"
        ).trim();

    if (
        displayAddedBy.length >
        30
    ) {
        displayAddedBy =
            displayAddedBy.substring(
                0,
                27
            ) +
            "...";
    }

    ctx.textAlign =
        "center";

    fitText(
        ctx,
        displayAddedBy,
        rightBox.w - 80,
        34,
        "bold"
    );

    ctx.fillStyle =
        "#111111";

    ctx.fillText(
        displayAddedBy,
        photoX,
        rightBox.y + 325
    );

    ctx.strokeStyle =
        "#2456c4";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
        145,
        900
    );

    ctx.lineTo(
        470,
        900
    );

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(
        1066,
        900
    );

    ctx.lineTo(
        1391,
        900
    );

    ctx.stroke();

    ctx.fillStyle =
        "#2456c4";

    ctx.font =
        "30px Arial";

    ctx.fillText(
        "✦",
        510,
        900
    );

    ctx.fillText(
        "",
        765,
        900
    );

    ctx.fillText(
        "",
        771,
        900
    );

    ctx.fillText(
        "✦",
        1025,
        900
    );

    ctx.fillStyle =
        "#111111";

    ctx.font =
        font(
            36,
            "bold"
        );

    ctx.fillText(
        "Thanks For Using My Bot",
        centerX,
        900
    );

    const imagePath =
        path.join(
            CACHE_DIR,
            `join_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2)}.png`
        );

    await new Promise(
        (
            resolve,
            reject
        ) => {
            const stream =
                canvas.createPNGStream();

            const output =
                fs.createWriteStream(
                    imagePath
                );

            stream.pipe(
                output
            );

            stream.on(
                "error",
                reject
            );

            output.on(
                "finish",
                resolve
            );

            output.on(
                "error",
                reject
            );
        }
    );

    return imagePath;
}

module.exports.run =
    async function ({
        api,
        event
    }) {
        let imagePath =
            null;

        try {
            if (
                !event.logMessageData ||
                !Array.isArray(
                    event.logMessageData
                        .addedParticipants
                )
            ) {
                return;
            }

            const threadID =
                event.threadID;

            const botID =
                api.getCurrentUserID();

            const participants =
                event.logMessageData
                    .addedParticipants;

            const botJoined =
                participants.some(
                    user =>
                        user.userFbId ==
                        botID
                );

            if (!botJoined) {
                return;
            }

            const botPrefix =
                String(
                    global.config.PREFIX ||
                        "/"
                );

            const botName =
                String(
                    global.config.BOTNAME ||
                        "SHAHADAT CHAT BOT"
                ).trim();

            try {
                await api.changeNickname(
                    `[ ${botPrefix} ] • ${botName}`,
                    threadID,
                    botID
                );
            } catch (
                error
            ) {
                console.error(
                    "[JOINNOTI NICKNAME ERROR]:",
                    error.message
                );
            }

            await new Promise(
                resolve => {
                    api.sendMessage(
                        `চ্ঁলে্ঁ এ্ঁসে্ঁছি্ঁ ${botName} এঁখঁনঁ তোঁমাঁদেঁরঁ সাঁথেঁ আঁড্ডাঁ দিঁবঁ..!`,
                        threadID,
                        () =>
                            resolve()
                    );
                }
            );

            const addedByID =
                event.author ||
                participants[0]
                    ?.userFbId;

            let addedByName =
                "Unknown User";

            if (
                addedByID
            ) {
                const addedUser =
                    await getAddedUser(
                        api,
                        addedByID
                    );

                addedByName =
                    addedUser.name;
            }

            imagePath =
                await createBotJoinBanner(
                    botName,
                    addedByID,
                    addedByName
                );

            const messageBody =
`╭•┄┅═══❁🌺❁═══┅┄•╮
     আসসালামু💚আলাইকুম
╰•┄┅═══❁🌺❁═══┅┄•╯

𝐓𝐡𝐚𝐧𝐤 𝐲𝐨𝐮 𝐬𝐨 𝐦𝐮𝐜𝐡 𝐟𝐨𝐫 𝐚𝐝𝐝𝐢𝐧𝐠 𝐦𝐞 𝐭𝐨 𝐲𝐨𝐮𝐫 𝐢-𝐠𝐫𝐨𝐮𝐩-🖤🤗

𝐈 𝐰𝐢𝐥𝐥 𝐚𝐥𝐰𝐚𝐲𝐬 𝐬𝐞𝐫𝐯𝐞 𝐲𝐨𝐮 𝐢𝐧𝐚𝐡𝐚𝐥𝐥𝐚𝐡 🌺❤️

𝐓𝐨 𝐯𝐢𝐞𝐰 𝐚𝐧𝐲 𝐜𝐨𝐦𝐦𝐚𝐧𝐝:
${botPrefix}Help
${botPrefix}Info
${botPrefix}Admin

★ যেকোনো অভিযোগ অথবা হেল্প এর জন্য এডমিন 𝐒𝐡𝐚𝐡𝐚𝐝𝐚𝐭 কে নক করতে পারেন ★

➤𝐌𝐞𝐬𝐬𝐞𝐧𝐠𝐞𝐫: https://m.me/100044713412032
➤𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩: https://wa.me/8801882333052

❖⋆═══════════════════════⋆❖
          𝐁𝐨𝐭 𝐎𝐰𝐧𝐞𝐫 ➢ 𝐒𝐇𝐀𝐇𝐀𝐃𝐀𝐓 𝐒𝐀𝐇𝐔`;

            return api.sendMessage(
                {
                    body:
                        messageBody,
                    attachment:
                        fs.createReadStream(
                            imagePath
                        )
                },
                threadID,
                () => {
                    try {
                        if (
                            imagePath &&
                            fs.existsSync(
                                imagePath
                            )
                        ) {
                            fs.unlinkSync(
                                imagePath
                            );
                        }
                    } catch (
                        cleanupError
                    ) {}
                }
            );

        } catch (
            error
        ) {
            console.error(
                "[JOINNOTI ERROR]:",
                error
            );

            try {
                if (
                    imagePath &&
                    fs.existsSync(
                        imagePath
                    )
                ) {
                    fs.unlinkSync(
                        imagePath
                    );
                }
            } catch (
                cleanupError
            ) {}

            return api.sendMessage(
                "❌ Bot join notification failed.",
                event.threadID
            );
        }
    };
