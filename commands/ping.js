(function () {
    'use strict';

    module.exports = (scope, senderid) => {
        if (arguments.length > 2) {
            var matches = 0;

            for (var v, i = 2; i < arguments.length; i++) {
                v = scope.memberList.find((v) => v.username == arguments[i]);

                if (v) {
                    scope.bot.sendMessage({
                        to: v.id,
                        message: scope.bot.fixMessage(`Ping from <@${senderid}>`)
                    });
                    scope.bot.sendMessage({
                        to: senderid,
                        message: scope.bot.fixMessage(`Pinged <@${v.id}>`)
                    });

                    console.log(scope.bot.fixMessage(`<@${senderid}> pinged <@${v.id}>`));

                    matches++;
                }
            }

            // Warn if no users were found by that username
            if (!matches) {
                scope.bot.sendMessage({
                    to: senderid,
                    message: `User: "${recipientName}" not found`
                });
            }
        } else {
            scope.bot.sendMessage({
                to: senderid,
                message: "pong"
            });
        }
    };
})();
