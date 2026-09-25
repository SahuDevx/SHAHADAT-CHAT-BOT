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
  name: "song",
  aliases: ["music", "songs", "gan"],
  version: "1.0.0",
  credits: "SHAHADAT SAHU", //ক্রেডিট চেন্জ করবেন না✅
  countDown: 10,
  hasPermssion: 0,
  description: "YouTube music downloader",
  category: "media",
  commandCategory: "media",
  usePrefix: true,
  usages: "{pn} song name"
};

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

async function downloadSong(api, event, data, index, waitMsg) {
  let file;

  try {
    const API = await ytapi();
    const song = data.songs[index];

    const { data: job } = await axios.post(
      `${API}/api/download`,
      {
        url: song.url,
        format: "mp3"
      },
      { timeout: 30000 }
    );

    if (!job?.job_id)
      throw new Error("Download job failed");

    let result;

    for (let i = 0; i < 180; i++) {
      await sleep(2000);

      const { data: status } = await axios.get(
        `${API}/api/jobs/${job.job_id}`,
        { timeout: 15000 }
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
      `song_${Date.now()}.mp3`
    );

    const audio = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 180000
    });

    fs.writeFileSync(file, audio.data);

    const remaining =
      data.songs.length - index - 1;

    const body =
`🎵 Song Downloader

🎧 Now Playing
━━━━━━━━━━━━━━━━━━
🎼 ${result.title || song.title || "Unknown"}
👤 ${song.channel?.name || "Unknown"}
⏱️ ${song.duration || "N/A"}
🎚️ MP3 • 192kbps
━━━━━━━━━━━━━━━━━━
${data.count < 5
  ? '💡 Reply "next" for the next song'
  : "✅ 5 songs completed"}`;

    api.sendMessage(
      {
        body,
        attachment: fs.createReadStream(file)
      },
      event.threadID,
      (err, info) => {

        if (waitMsg?.messageID)
          api.unsendMessage(
            waitMsg.messageID
          ).catch(() => {});

        if (file && fs.existsSync(file))
          setTimeout(() => {
            if (fs.existsSync(file))
              fs.unlinkSync(file);
          }, 15000);

        if (!err && data.count < 5) {
          global.client.handleReply.push({
            name: "song",
            messageID: info.messageID,
            author: event.senderID,
            results: data.songs,
            index,
            count: data.count
          });
        }
      }
    );

  } catch (error) {

    if (file && fs.existsSync(file))
      fs.unlinkSync(file);

    if (error.message === "UNAVAILABLE") {
      return findNext(
        api,
        event,
        data,
        index + 1,
        waitMsg
      );
    }

    if (waitMsg?.messageID)
      api.unsendMessage(
        waitMsg.messageID
      ).catch(() => {});

    return api.sendMessage(
      `❌ Download failed\n\n${error.message}`,
      event.threadID,
      event.messageID
    );
  }
}

async function findNext(api, event, data, index, waitMsg) {

  if (index >= data.songs.length) {
    if (waitMsg?.messageID)
      api.unsendMessage(
        waitMsg.messageID
      ).catch(() => {});

    return api.sendMessage(
      "❌ No more playable songs found.",
      event.threadID,
      event.messageID
    );
  }

  return downloadSong(
    api,
    event,
    data,
    index,
    waitMsg
  );
}

module.exports.run = async ({
  api,
  event,
  args
}) => {

  if (!args.length)
    return api.sendMessage(
      "🎵 Please enter a song name.",
      event.threadID,
      event.messageID
    );

  let searchMsg;

  try {

    const API = await ytapi();

    searchMsg = await api.sendMessage(
      "🔎 Searching YouTube...",
      event.threadID,
      event.messageID
    );

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

    const songs = (data.results || [])
      .filter(song => {
        const id =
          song.videoId ||
          song.id ||
          song.url;

        if (!id || seen.has(id))
          return false;

        seen.add(id);
        return true;
      });

    if (!songs.length)
      throw new Error("No songs found");

    return downloadSong(
      api,
      event,
      {
        songs,
        count: 1
      },
      0,
      searchMsg
    );

  } catch (error) {

    if (searchMsg?.messageID)
      api.unsendMessage(
        searchMsg.messageID
      ).catch(() => {});

    return api.sendMessage(
      `⚠️ Search failed\n${
        error.response?.data?.error?.message ||
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
    event.senderID !== handleReply.author ||
    String(event.body || "")
      .trim()
      .toLowerCase() !== "next"
  ) return;

  if (handleReply.count >= 5)
    return;

  const waitMsg = await api.sendMessage(
    "⏳ Please wait...\n\n🎵 Loading the next song...",
    event.threadID,
    event.messageID
  );

  return downloadSong(
    api,
    event,
    {
      songs: handleReply.results,
      count: handleReply.count + 1
    },
    handleReply.index + 1,
    waitMsg
  );
};
