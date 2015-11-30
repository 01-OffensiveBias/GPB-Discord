(function() {
    'use strict';

    // TODO More documentation

    // Imports
    var fs               = require('fs');
    var DiscordClient    = require('discord.io');

    // Get bot info
    var botinfo          = JSON.parse(fs.readFileSync('botinfo.json'));

    // Constants
    var BOTUID           = botinfo.constants.botuid;
    var SERVERID         = botinfo.constants.serverid;

    // Globals
    var discordServer;
    var channels;
    var members;
    var directChannels   = [];
    var globalChannels   = [];
    var memberList       = [];
    var bot              = new DiscordClient(botinfo.loginInfo);
    var authorized_users = botinfo.authorized_users;
    var denialMessages   = botinfo.denialMessages;
    var publicCommands   = botinfo.publicCommands;

    // Collection of commands
    var commands = {
        ping: function(senderid) {
            if (arguments.length > 1) {
                var matches = 0;

                for (var v, i = 1; i < arguments.length; i++) {
                    v = memberList.find((v) => v.username == arguments[i]);

                    if (v) {
                        bot.sendMessage({
                            to: v.id,
                            message: bot.fixMessage(`Ping from <@${senderid}>`)
                        });
                        bot.sendMessage({
                            to: senderid,
                            message: bot.fixMessage(`Pinged <@${v.id}>`)
                        });

                        console.log(bot.fixMessage(`<@${senderid}> pinged <@${v.id}>`));

                        matches++;
                    }
                }

                // Warn if no users were found by that username
                if (!matches) {
                    bot.sendMessage({
                        to: senderid,
                        message: `User: "${recipientName}" not found`
                    });
                }
            } else {
                bot.sendMessage({
                    to: senderid,
                    message: "pong"
                });
            }
        },
        clean: function(senderid, channelName) {
            if (channelName) {
                globalChannels
                    .filter((v) => channels[v].name == channelName)
                    .forEach((v) => {
                        // Clean the channel of spam
                        bot.getMessages({
                            channel: channels[v].id,
                            limit: 5
                        }, function(messages) {
                            console.log(messages);
                        });
                    });
            } else {
                globalChannels.forEach((v) => {
                    // Clean the channel of spam
                    bot.getMessages({
                        channel: channels[v].id,
                        limit: 5
                    }, function(messages) {
                        console.log(messages);
                    });
                });
            }
        }
    };

    // TODO Implement active spam monitoring
    bot.on('ready', function() {
        discordServer = bot.servers[SERVERID];
        channels = discordServer.channels;
        members = discordServer.members;

        // TODO Periodically spawn a worker to rebuild these arrays

        // Add all direct message channels into the directChannels array
        Object.keys(bot.directMessages).forEach((v) => {
            if (directChannels.indexOf(bot.directMessages[v].id) == -1)
                directChannels.push(bot.directMessages[v].id);
        });

        // Add all of the global text channels into the globalChannels array
        Object.keys(channels).forEach((v) => {
            if (channels[v].type == "text" && directChannels.indexOf(v) == -1)
                globalChannels.push(v);
        });

        // Add all of the "user" objects to the MeberList array
        Object.keys(members).forEach((v) => {
            memberList.push(members[v].user);
        });

        console.log("I am the Warden Eternal. I stand in service to Cortana.");
    });

    // TODO Create a proper permissions system
    bot.on('message', function(user, userID, channelID, message, rawEvent) {
        // Make sure it's a PM and it isn't from itself
        if (directChannels.indexOf(channelID) > -1 && userID != BOTUID) {
            // Parse arguments
            var cmdargs = message.split(" ");
            var cmd = cmdargs.shift();

            // Authorize the user
            if (publicCommands.indexOf(cmd) > -1 || authorize(userID)) {
                // Null-check
                if (commands[cmd])
                    commands[cmd].apply(rawEvent, [userID].concat(cmdargs));
                else
                    bot.sendMessage({
                        to: userID,
                        message: "Command not found"
                    });
            } else {
                bot.sendMessage({
                    to: userID,
                    message: denialMessages[Math.floor(Math.random() * denialMessages.length)]
                });
            }
        }
    });

    function authorize(userid) {
        return authorized_users.filter((v) => v.userid == userid).length > 0;

        // for (var i = 0; i < authorized_users.length; i++) {
        //     if (authorized_users[i].userid == userid) {
        //         return true;
        //     }
        // }
        //
        // return false;
    }
})();
