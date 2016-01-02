(function () {
    // TODO Clean up this function (pun intentional)
    module.exports = (scope, senderid, channelName) => {
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
    };
})();
