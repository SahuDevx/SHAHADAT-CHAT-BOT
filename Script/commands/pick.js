module.exports.config = {
  name: "pick",
  aliases: ["pic", "pinterest", "pin"],
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Shaon Ahmed",
  description: "Pinterest image search",
  commandCategory: "Media",
  usages: "pic <keyword> [amount]",
  cooldowns: 5,
  usePrefix: true
};

module.exports.run = async ({ api, event, args }) => {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];
  const path = require("path");

  const {
    threadID,
    messageID
  } = event;

  if (!args.length) {
    return api.sendMessage(
      "Type something to search!\nExample: /pic cat",
      threadID,
      messageID
    );
  }

  try {
    const apiConfig = await axios.get(
      "https://raw.githubusercontent.com/shaonproject/Shaon/main/api.json"
    );

    const apiBase = apiConfig.data.noobs;

    const lastArg = args[args.length - 1];

    const amount = isNaN(lastArg)
      ? 6
      : Math.min(
          Math.max(
            parseInt(lastArg),
            1
          ),
          10
        );

    const keyword = isNaN(lastArg)
      ? args.join(" ")
      : args.slice(0, -1).join(" ");

    if (!keyword) {
      return api.sendMessage(
        "⚠️ Please enter a search keyword.",
        threadID,
        messageID
      );
    }

    const searchMsg =
      await new Promise(
        resolve => {
          api.sendMessage(
            "🔍 Searching...",
            threadID,
            (err, info) =>
              resolve(
                info?.messageID
              ),
            messageID
          );
        }
      );

    const res = await axios.get(
      `${apiBase}/pinterest?search=${encodeURIComponent(keyword)}`,
      {
        timeout: 30000
      }
    );

    const images =
      Array.isArray(res.data?.data)
        ? res.data.data
        : [];

    if (!images.length) {
      if (searchMsg) {
        try {
          await api.unsendMessage(
            searchMsg
          );
        } catch {}
      }

      return api.sendMessage(
        "❌ No results found!",
        threadID,
        messageID
      );
    }

    const total = Math.min(
      images.length,
      amount
    );

    const attachments = [];
    const files = [];

    for (
      let i = 0;
      i < total;
      i++
    ) {
      if (!images[i]) continue;

      const filePath =
        path.join(
          __dirname,
          "cache",
          `pic_${Date.now()}_${i}.jpg`
        );

      const img =
        await axios.get(
          images[i],
          {
            responseType:
              "arraybuffer",
            timeout: 30000
          }
        );

      fs.writeFileSync(
        filePath,
        img.data
      );

      files.push(filePath);
      attachments.push(
        fs.createReadStream(
          filePath
        )
      );
    }

    if (!attachments.length) {
      return api.sendMessage(
        "❌ Failed to load images!",
        threadID,
        messageID
      );
    }

    return api.sendMessage(
      {
        body:
          `🖼️ ${attachments.length} results found\n` +
          `🔎 Search: ${keyword}`,
        attachment:
          attachments
      },
      threadID,
      async () => {
        if (searchMsg) {
          try {
            await api.unsendMessage(
              searchMsg
            );
          } catch {}
        }

        for (const file of files) {
          try {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
            }
          } catch {}
        }
      },
      messageID
    );

  } catch (error) {
    return api.sendMessage(
      "❌ Failed to load images!",
      threadID,
      messageID
    );
  }
};
