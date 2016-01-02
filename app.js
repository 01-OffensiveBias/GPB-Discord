(function() {
    'use strict';

    // TODO More documentation

    // Imports
    var fs               = require('fs');
    var ytdl             = require('ytdl-core');
    var express          = require('express');
    var DiscordClient    = require('discord.io');
    var commands         = require('./commands');

    // Get bot info
    var botinfo          = JSON.parse(fs.readFileSync('botinfo.json'));

    // Constants
    // TODO Use the 'presence' event from DiscordClient?
    var BOTUID           = botinfo.constants.botuid;
    var SERVERID         = botinfo.constants.serverid;
    var DOMAIN           = botinfo.constants.domain;
    var DOWNLOADS        = botinfo.constants.downloads;

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
    var app              = express();

    // Create the downloads directory for the wget command
    try {
        fs.statSync(DOWNLOADS).isDirectory();
    } catch (e) {
        fs.mkdir(DOWNLOADS);
    }

    app.use('/' + DOWNLOADS, express.static(__dirname + '/' + DOWNLOADS));

    var server = app.listen(8080, () => {
        console.log("File host started.");
    });

    // TODO Implement active spam monitoring
    bot.on('ready', function() {
        discordServer = bot.servers[SERVERID];
        channels = discordServer.channels;
        members = discordServer.members;

        // TODO Periodically spawn a worker to rebuild these arrays
        rebuildChannelArrays();

        // Have to be careful about interfering with current tasks
        // that are using those arrays
        setInterval(rebuildChannelArrays, 60000); // Figure out a better event-based solution

        console.log("I am the Warden Eternal. I stand in service to Cortana.");
    });

    // TODO Create a proper permissions system
    bot.on('message', function(user, userID, channelID, message, rawEvent) {
        console.log(`${user} (${userID}): ${message} -> ${channelID}`);
        // Make sure it's a PM and it isn't from itself
        if (directChannels.indexOf(channelID) > -1 && userID != BOTUID) {
            // Parse arguments
            var cmdargs = message.split(" ");
            var cmd = cmdargs.shift();

            // Authorize the user
            if (publicCommands.indexOf(cmd) > -1 || authorize(userID)) {
                // Null-check
                if (commands[cmd])
                    try {
                        var scope = {
                            BOTID: BOTUID,
                            SERVERID: SERVERID,
                            DOMAIN: DOMAIN,
                            DOWNLOADS: DOWNLOADS,
                            directChannels: directChannels,
                            globalChannels: globalChannels,
                            memberList: memberList,
                            bot: bot
                        };
                        commands[cmd].apply(rawEvent, [scope, userID].concat(cmdargs));
                    } catch (e) {
                        botinfo.authorized_users
                            .filter((v) => v.admin)
                            .forEach((v) => {
                                bot.sendMessage({
                                    to: v.userid,
                                    message: `${e}`
                                });
                            });
                    }
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

    function rebuildChannelArrays() {
        var newDirectChannels   = [];
        var newGlobalChannels   = [];
        var newMemberList       = [];

        // Add all direct message channels into the directChannels array
        Object.keys(bot.directMessages).forEach(v => {
            if (newDirectChannels.indexOf(bot.directMessages[v].id) == -1)
                newDirectChannels.push(bot.directMessages[v].id);
        });

        // Add all of the global text channels into the globalChannels array
        Object.keys(channels).forEach(v => {
            if (channels[v].type == "text" && newDirectChannels.indexOf(v) == -1)
                newGlobalChannels.push(v);
        });

        // Add all of the "user" objects to the MeberList array
        Object.keys(members).forEach(v => {
            newMemberList.push(members[v].user);
        });

        // Will this encounter issues with references being thrown around?
        directChannels   = newDirectChannels.slice(0);
        globalChannels   = newGlobalChannels.slice(0);
        memberList       = newMemberList.slice(0);

        console.log("Rebuilt channel arrays");
    }

    function authorize(userid) {
        return authorized_users.filter((v) => v.userid == userid).length > 0;
    }

    function parseYoutubeUrl (url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match&&match[7].length==11)? match[7] : false;
    }
})();
