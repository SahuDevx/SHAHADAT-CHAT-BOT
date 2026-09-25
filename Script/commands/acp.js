const moment = require("moment-timezone");

module.exports.config = {
  name: "acp",
  aliases: ["accept", "accepted"],
  version: "1.0.0",
  hasPermssion: 2,
  credits: "SHAHADAT SAHU",
  description: "Accept or delete friend requests",
  commandCategory: "system",
  usages: "acp",
  cooldowns: 0
};

module.exports.handleReply = async ({ handleReply, event, api }) => {
  const { author, listRequest } = handleReply;
  if (author !== event.senderID) return;

  const args = event.body.trim().toLowerCase().split(" ");

  const action = args[0];
  if (!["add", "del"].includes(action))
    return api.sendMessage("Use: add <stt/all> OR del <stt/all>", event.threadID);

  const form = {
    av: api.getCurrentUserID(),
    fb_api_caller_class: "RelayModern",
    variables: {
      input: {
        source: "friends_tab",
        actor_id: api.getCurrentUserID(),
        client_mutation_id: Math.round(Math.random() * 19).toString()
      },
      scale: 3,
      refresh_num: 0
    }
  };

  if (action === "add") {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
    form.doc_id = "3147613905362928";
  } else {
    form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
    form.doc_id = "4108254489275063";
  }

  let targetIDs = args.slice(1);

  if (targetIDs[0] === "all")
    targetIDs = listRequest.map((_, i) => (i + 1).toString());

  const success = [];
  const failed = [];
  const promises = [];

  for (const stt of targetIDs) {
    const user = listRequest[parseInt(stt) - 1];
    if (!user) {
      failed.push(`Unknown stt: ${stt}`);
      continue;
    }

    form.variables.input.friend_requester_id = user.node.id;
    const variablesBackup = JSON.stringify(form.variables);
    form.variables = variablesBackup;

    promises.push(
      api.httpPost("https://www.facebook.com/api/graphql/", form)
        .then(res => ({ user, res }))
        .catch(() => ({ user, error: true }))
    );

    form.variables = JSON.parse(variablesBackup);
  }

  const results = await Promise.all(promises);
  for (const result of results) {
    if (result.error) failed.push(result.user.node.name);
    else {
      try {
        const data = JSON.parse(result.res);
        if (data.errors) failed.push(result.user.node.name);
        else success.push(result.user.node.name);
      } catch {
        failed.push(result.user.node.name);
      }
    }
  }

  api.sendMessage(
    `Done: ${action === "add" ? "Accepted" : "Deleted"} ${success.length} requests\n${success.join("\n")}${failed.length ? `\n\nFailed: ${failed.length}\n${failed.join("\n")}` : ""}`,
    event.threadID,
    event.messageID
  );
};

module.exports.run = async ({ event, api }) => {
  const form = {
    av: api.getCurrentUserID(),
    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
    fb_api_caller_class: "RelayModern",
    doc_id: "4499164963466303",
    variables: JSON.stringify({ input: { scale: 3 } })
  };

  try {
    const res = await api.httpPost("https://www.facebook.com/api/graphql/", form);
    const data = JSON.parse(res);
    const list = data.data.viewer.friending_possibilities.edges;

    let msg = "";
    let i = 0;

    for (const u of list) {
      i++;
      msg += `\n${i}. Name: ${u.node.name}\nID: ${u.node.id}\nUrl: ${u.node.url.replace("www.facebook", "fb")}\nTime: ${moment(u.time * 1000).tz("Asia/Dhaka").format("DD/MM/YYYY HH:mm:ss")}\n`;
    }

    api.sendMessage(msg + "\nReply this message:\nadd <stt/all>\ndel <stt/all>", event.threadID, (e, info) => {
      global.client.handleReply.push({
        name: module.exports.config.name,
        messageID: info.messageID,
        listRequest: list,
        author: event.senderID
      });
    });

  } catch (err) {
    api.sendMessage("Error loading friend requests.", event.threadID);
  }
};
