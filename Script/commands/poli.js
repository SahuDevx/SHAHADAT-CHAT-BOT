module.exports.config = {
  name: "poli",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "𝐈𝐬𝐥𝐚𝐦𝐢𝐜𝐤 𝐂𝐲𝐛𝐞𝐫",
  description: "Generate image from Pollinations",
  commandCategory: "user",
  usages: "poli <text>",
  cooldowns: 2
};

module.exports.run = async function ({
  api,
  event,
  args
}) {
  const axios = global.nodemodule["axios"];
  const fs = global.nodemodule["fs-extra"];

  const {
    threadID,
    messageID
  } = event;

  const query = args.join(" ");

  if (!query) {
    return api.sendMessage(
      "⚠️ Please provide a prompt.",
      threadID,
      messageID
    );
  }

  const filePath =
    __dirname +
    "/cache/poli.png";

  try {
    const response =
      await axios.get(
        `https://image.pollinations.ai/prompt/${encodeURIComponent(query)}`,
        {
          responseType: "arraybuffer",
          timeout: 60000
        }
      );

    fs.writeFileSync(
      filePath,
      Buffer.from(response.data)
    );

    return api.sendMessage(
      {
        body: "✨ Here's your image!",
        attachment:
          fs.createReadStream(
            filePath
          )
      },
      threadID,
      () => {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {}
      },
      messageID
    );

  } catch (error) {
    return api.sendMessage(
      "❌ Failed to generate image.",
      threadID,
      messageID
    );
  }
};
