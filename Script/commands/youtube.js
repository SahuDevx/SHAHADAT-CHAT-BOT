const axios = require("axios");
const fs = require("fs");
const path = require("path");

const ytapi = async () => {
  const api = await axios.get(
    "https://gitlab.com/shahadat-sahu/sahu-api/-/raw/main/API.json"
  );
  return api.data.ytapi;
};

module.exports.config = {
  name: "youtube",
  version: "1.0.0",
  aliases: ["video", "yt"],
  credits: "SHAHADAT SAHU",
  countDown: 5,
  hasPermssion: 0,
  description: "Search and download YouTube videos",
  category: "media",
  commandCategory: "media",
  usages: "{pn} video name"
};

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

function formatDuration(duration) {
  if (
    duration === undefined ||
    duration === null ||
    duration === ""
  )
    return "N/A";

  if (typeof duration === "string") {
    const value = duration.trim();

    if (value.includes(":"))
      return value;

    const number = Number(value);

    if (!Number.isFinite(number))
      return value;

    duration = number;
  }

  const seconds = Math.floor(Number(duration));

  if (!Number.isFinite(seconds) || seconds < 0)
    return "N/A";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(
    (seconds % 3600) / 60
  );
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(
    2,
    "0"
  )}`;
}

async function getThumbnail(url) {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
      timeout: 30000
    });

    return response.data;
  } catch {
    return null;
  }
}

async function downloadVideo(api, event, video) {
  let filePath;

  try {
    const API = await ytapi();

    const { data: job } = await axios.post(
      `${API}/api/download`,
      {
        url:
          video.url ||
          `https://www.youtube.com/watch?v=${
            video.videoId || video.id
          }`,
        format: "mp4"
      },
      {
        timeout: 30000
      }
    );

    if (!job?.job_id)
      throw new Error(
        "Download job failed"
      );

    let result;

    for (let i = 0; i < 180; i++) {
      await sleep(2000);

      const { data: status } =
        await axios.get(
          `${API}/api/jobs/${job.job_id}`,
          {
            timeout: 15000
          }
        );

      if (status.status === "failed")
        throw new Error(
          "UNAVAILABLE"
        );

      if (
        status.status === "completed" ||
        status.status === "done"
      ) {
        result = status;
        break;
      }
    }

    if (!result)
      throw new Error(
        "UNAVAILABLE"
      );

    let fileUrl =
      result.file_url ||
      result.download_url ||
      result.url;

    if (!fileUrl && result.filename) {
      fileUrl =
        `${API}/files/${encodeURIComponent(
          result.filename
        )}`;
    }

    if (!fileUrl)
      throw new Error(
        "UNAVAILABLE"
      );

    if (fileUrl.startsWith("/"))
      fileUrl = `${API}${fileUrl}`;

    filePath = path.join(
      __dirname,
      `video_${Date.now()}.mp4`
    );

    const videoFile = await axios.get(
      fileUrl,
      {
        responseType: "arraybuffer",
        timeout: 300000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    fs.writeFileSync(
      filePath,
      videoFile.data
    );

    return api.sendMessage(
      {
        body:
`🎬 Video Ready
━━━━━━━━━━━━━━━━━━
🎥 ${result.title || video.title || "Video"}
👤 ${video.channel || "Unknown"}
⏱️ ${formatDuration(
  video.duration
)}
🎚️ MP4
━━━━━━━━━━━━━━━━━━
🎧 Enjoy your video!`,
        attachment:
          fs.createReadStream(filePath)
      },
      event.threadID,
      () => {
        setTimeout(() => {
          if (
            filePath &&
            fs.existsSync(filePath)
          ) {
            fs.unlinkSync(filePath);
          }
        }, 15000);
      },
      event.messageID
    );

  } catch (error) {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);
    }

    return api.sendMessage(
      `❌ Video download failed\n\n${
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message
      }`,
      event.threadID,
      event.messageID
    );
  }
}

module.exports.run = async ({
  api,
  args,
  event
}) => {
  if (!args.length) {
    return api.sendMessage(
      "🎬 Please enter a video name.",
      event.threadID,
      event.messageID
    );
  }

  try {
    const API = await ytapi();

    const { data } = await axios.get(
      `${API}/api/search`,
      {
        params: {
          q: args.join(" "),
          limit: 15
        },
        timeout: 30000
      }
    );

    const seen = new Set();

    const results = (data.results || [])
      .filter(video => {
        const id =
          video.videoId ||
          video.id ||
          video.url;

        if (!id || seen.has(id))
          return false;

        seen.add(id);
        return true;
      })
      .slice(0, 5)
      .map(video => ({
        ...video,
        id:
          video.videoId ||
          video.id,
        url:
          video.url ||
          `https://www.youtube.com/watch?v=${
            video.videoId ||
            video.id
          }`
      }));

    if (!results.length)
      throw new Error(
        "No videos found"
      );

    const attachments = [];

    for (const video of results) {
      const id =
        video.videoId ||
        video.id;

      const thumbnail =
        video.thumbnail ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      const image =
        await getThumbnail(thumbnail);

      if (image)
        attachments.push(image);
    }

    let text =
`🎬 YouTube Video Search
━━━━━━━━━━━━━━━━━━

`;

    results.forEach((video, i) => {
      text +=
`${i + 1}. ${video.title || "Unknown"}
👤 ${
  video.channel?.name ||
  video.channel ||
  video.author ||
  "Unknown"
}
⏱️ ${formatDuration(
  video.duration ||
  video.time
)}

`;
    });

    text +=
`━━━━━━━━━━━━━━━━━━
💡 Reply with a number (1-${results.length}) to download`;

    return api.sendMessage(
      {
        body: text,
        ...(attachments.length
          ? {
              attachment: attachments
            }
          : {})
      },
      event.threadID,
      (err, info) => {
        if (err || !info?.messageID)
          return;

        global.client.handleReply.push({
          name: "youtube",
          messageID: info.messageID,
          author: event.senderID,
          results
        });
      },
      event.messageID
    );

  } catch (error) {
    return api.sendMessage(
      `⚠️ Search failed\n\n${
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
        error.message
      }`,
      event.threadID,
      event.messageID
    );
  }
};

module.exports.handleReply = async ({
  api,
  event,
  handleReply
}) => {
  if (
    event.senderID !==
    handleReply.author
  )
    return;

  const choice = parseInt(
    String(event.body || "").trim()
  );

  if (
    isNaN(choice) ||
    choice < 1 ||
    choice >
      handleReply.results.length
  ) {
    return api.sendMessage(
      `❌ Invalid choice.\nPlease reply with a number between 1 and ${handleReply.results.length}.`,
      event.threadID,
      event.messageID
    );
  }

  const video =
    handleReply.results[choice - 1];

  await api.unsendMessage(
    handleReply.messageID
  ).catch(() => {});

  return downloadVideo(
    api,
    event,
    video
  );
};
