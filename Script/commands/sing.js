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
  name: "sing",
  aliases: ["audio", "play"],
  version: "1.0.0",
  credits: "SHAHADAT SAHU", //Don't Change Credit✅
  countDown: 10,
  hasPermssion: 0,
  description: "Search and download YouTube music",
  category: "media",
  commandCategory: "media",
  usages: "{pn} song name"
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
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${minutes}:${String(secs).padStart(2, "0")}`;
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

async function downloadSong(api, event, song) {
  let file;

  try {
    const API = await ytapi();

    const { data: job } = await axios.post(
      `${API}/api/download`,
      {
        url:
          song.url ||
          `https://www.youtube.com/watch?v=${
            song.videoId || song.id
          }`,
        format: "mp3"
      },
      {
        timeout: 30000
      }
    );

    if (!job?.job_id)
      throw new Error("Download job failed");

    let result;

    for (let i = 0; i < 180; i++) {
      await sleep(2000);

      const { data: status } = await axios.get(
        `${API}/api/jobs/${job.job_id}`,
        {
          timeout: 15000
        }
      );

      if (status.status === "failed")
        throw new Error("UNAVAILABLE");

      if (status.status === "completed") {
        result = status;
        break;
      }
    }

    if (!result?.file_url)
      throw new Error("UNAVAILABLE");

    const url = result.file_url.startsWith("/")
      ? `${API}${result.file_url}`
      : result.file_url;

    file = path.join(
      __dirname,
      `sing_${Date.now()}.mp3`
    );

    const audio = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 180000
    });

    fs.writeFileSync(file, audio.data);

    return api.sendMessage(
      {
        body:
`🎵 Song Ready
━━━━━━━━━━━━━━━━━━
🎼 ${result.title || song.title || "Music"}
👤 ${song.channel?.name || song.channel || "Unknown"}
⏱️ ${formatDuration(song.duration ?? song.time)}
🎚️ MP3 • 192kbps
━━━━━━━━━━━━━━━━━━
🎧 Enjoy your music!`,
        attachment: fs.createReadStream(file)
      },
      event.threadID,
      () => {
        setTimeout(() => {
          if (file && fs.existsSync(file))
            fs.unlinkSync(file);
        }, 15000);
      },
      event.messageID
    );

  } catch (error) {
    if (file && fs.existsSync(file))
      fs.unlinkSync(file);

    return api.sendMessage(
      `❌ Download failed\n\n${
        error.response?.data?.error?.message ||
        error.response?.data?.detail ||
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
  if (!args.length)
    return api.sendMessage(
      "🎵 Please enter a song name.",
      event.threadID,
      event.messageID
    );

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
      .filter(song => {
        const id =
          song.videoId ||
          song.id ||
          song.url;

        if (!id || seen.has(id))
          return false;

        seen.add(id);
        return true;
      })
      .slice(0, 5);

    if (!results.length)
      throw new Error("No songs found");

    const attachments = [];

    for (const song of results) {
      const id =
        song.videoId ||
        song.id;

      const thumbnail =
        song.thumbnail ||
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

      const image = await getThumbnail(thumbnail);

      if (image)
        attachments.push(image);
    }

    let text =
`🎵 YouTube Song Search
━━━━━━━━━━━━━━━━━━

`;

    results.forEach((song, i) => {
      text +=
`${i + 1}. ${song.title || "Unknown"}
👤 ${song.channel?.name || song.channel || "Unknown"}
⏱️ ${formatDuration(song.duration ?? song.time)}

`;
    });

    text +=
`━━━━━━━━━━━━━━━━━━
💡 Reply with a number (1-${results.length}) to download`;

    return api.sendMessage(
      {
        body: text,
        ...(attachments.length
          ? { attachment: attachments }
          : {})
      },
      event.threadID,
      (err, info) => {
        if (err || !info?.messageID)
          return;

        global.client.handleReply.push({
          name: "sing",
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
    event.senderID !== handleReply.author
  )
    return;

  const choice = parseInt(
    String(event.body || "").trim()
  );

  if (
    isNaN(choice) ||
    choice < 1 ||
    choice > handleReply.results.length
  ) {
    return api.sendMessage(
      `❌ Invalid choice.\nPlease reply with a number between 1 and ${handleReply.results.length}.`,
      event.threadID,
      event.messageID
    );
  }

  const song =
    handleReply.results[choice - 1];

  await api.unsendMessage(
    handleReply.messageID
  ).catch(() => {});

  return downloadSong(
    api,
    event,
    song
  );
};
