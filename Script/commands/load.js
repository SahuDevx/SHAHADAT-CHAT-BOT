const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "load",
    aliases: ["reload"],
    version: "1.1.0",
    hasPermssion: 2,
    credits: "SHAHADAT SAHU",
    description: "Reload commands",
    commandCategory: "System",
    usages: "load [commandName]",
    cooldowns: 0
};

module.exports.run = async function ({ api, event, args }) {
    const {
        threadID,
        messageID,
        senderID
    } = event;

    const userID = String(senderID);

    const adminBot = Array.isArray(global.config?.ADMINBOT)
        ? global.config.ADMINBOT.map(id => String(id))
        : [];

    const ndh = Array.isArray(global.config?.NDH)
        ? global.config.NDH.map(id => String(id))
        : [];

    const isAdmin =
        adminBot.includes(userID) ||
        ndh.includes(userID);

    if (!isAdmin) {
        return api.sendMessage(
            "Only Bot Admin can use this command.",
            threadID,
            messageID
        );
    }

    const root = global.client.mainPath;

    const findCommandsFolder = (dir) => {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const full = path.join(dir, file);

            if (fs.statSync(full).isDirectory()) {
                if (
                    file.toLowerCase() === "commands"
                ) {
                    return full;
                }

                const deep =
                    findCommandsFolder(full);

                if (deep) return deep;
            }
        }

        return null;
    };

    const commandsPath =
        findCommandsFolder(root);

    if (!commandsPath) {
        return api.sendMessage(
            "Commands folder not found.",
            threadID,
            messageID
        );
    }

    const target = args[0];

    let loaded = [];
    let failed = [];

    const resolvedTarget =
        target &&
        typeof global.client.resolveCommandName === "function"
            ? global.client.resolveCommandName(target) || target
            : target;

    const removeFromRegistry = (name) => {
        if (
            typeof global.client.unregisterCommand ===
            "function"
        ) {
            global.client.unregisterCommand(name);
            return;
        }

        if (
            global.client.commands &&
            typeof global.client.commands.delete ===
            "function"
        ) {
            global.client.commands.delete(name);
        }
    };

    const loadFile = (filePath) => {
        try {
            delete require.cache[
                require.resolve(filePath)
            ];

            const cmd = require(filePath);

            if (!cmd.config?.name) {
                failed.push(
                    path.basename(filePath)
                );
                return;
            }

            if (
                typeof global.client.registerCommand ===
                "function"
            ) {
                removeFromRegistry(
                    cmd.config.name
                );

                const registered =
                    global.client.registerCommand(
                        cmd,
                        path.basename(
                            filePath,
                            ".js"
                        )
                    );

                if (!registered?.ok) {
                    failed.push(
                        `${path.basename(filePath)} (${registered?.reason || "Register failed"})`
                    );
                    return;
                }

                for (
                    const skipped of
                    registered.skipped || []
                ) {
                    failed.push(
                        `${registered.name}: alias "${skipped.alias}" skipped (${skipped.reason})`
                    );
                }

                loaded.push(
                    registered.name
                );

                return;
            }

            global.client.commands.set(
                cmd.config.name,
                cmd
            );

            loaded.push(
                cmd.config.name
            );

        } catch (error) {
            failed.push(
                `${path.basename(filePath)} (${error.message})`
            );
        }
    };

    const walk = (dir) => {
        const files =
            fs.readdirSync(dir);

        for (const file of files) {
            const full =
                path.join(dir, file);

            if (
                fs.statSync(full).isDirectory()
            ) {
                walk(full);
            } else if (
                file.endsWith(".js")
            ) {
                loadFile(full);
            }
        }
    };

    if (!target) {

        for (
            const name of [
                ...global.client.commands.keys()
            ]
        ) {
            removeFromRegistry(name);
        }

        walk(commandsPath);

    } else {

        let found = false;

        const search = (dir) => {
            const files =
                fs.readdirSync(dir);

            for (const file of files) {
                const full =
                    path.join(dir, file);

                if (
                    fs.statSync(full).isDirectory()
                ) {
                    search(full);
                } else if (
                    file.endsWith(".js")
                ) {
                    try {
                        const command =
                            require(full);

                        const name =
                            command.config?.name;

                        if (
                            name === resolvedTarget
                        ) {
                            found = true;

                            removeFromRegistry(
                                name
                            );

                            loadFile(full);
                        }

                    } catch {}
                }
            }
        };

        search(commandsPath);

        if (!found) {
            return api.sendMessage(
                `Command not found: ${target}`,
                threadID,
                messageID
            );
        }
    }

    let msg =
        `Successful Load ${loaded.length} Command ✅\n\n`;

    msg +=
        `Failed ${failed.length} Command ⚠️\n`;

    if (failed.length) {
        msg += failed.join("\n");
    }

    return api.sendMessage(
        msg,
        threadID,
        messageID
    );
};
