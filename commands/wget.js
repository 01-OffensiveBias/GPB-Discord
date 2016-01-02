(function () {
    'use strict';

    var ytdl = require('ytdl-core');
    var sanitize = require('sanitize-filename');
    var fs = require('fs');

    function parseYoutubeUrl (url) {
        var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        var match = url.match(regExp);
        return (match&&match[7].length==11)? match[7] : false;
    }

    // TODO Record what files have been downloaded to avoid downloading twice
    module.exports = (scope, senderid, url) => {
        if (parseYoutubeUrl(url)) {
            ytdl.getInfo(url, (err, info) => {
                if (!err) {
                    // Get the highest quality video that meet this criteria
                    var video = info.formats.filter(f =>
                        f.audioEncoding && (
                            (f.quality == "hd720" && f.container == "mp4") ||
                            (f.quality == "medium" && f.container == "mp4") ||
                            (f.quality == "small" && f.container == "3gp")
                        )
                    )[0];
                    var stream = ytdl.downloadFromInfo(info, {
                        filter: (format) =>
                            format.quality == video.quality && format.container == video.container
                    });
                    // TODO Download progress indicator by editing this message
                    stream.on('response', (res) => scope.bot.sendMessage({
                        to: senderid,
                        message: "Downloading..."
                    }));
                    stream.on('end', () =>
                        scope.bot.sendMessage({
                            to: senderid,
                            message: `Finished downloading "${info.title}"\nDownload it here: http://${scope.DOMAIN}:8080/${scope.DOWNLOADS}/${encodeURIComponent(sanitize(info.title))}.${video.container}`
                        })
                    );
                    stream.pipe(fs.createWriteStream(`${scope.DOWNLOADS}/${sanitize(info.title)}.${video.container}`));
                } else {
                    console.log(err);
                }
            });
        } else if (false) {
            // TODO Generic file download
        } else {
            scope.bot.sendMessage({
                to: senderid,
                message: `Url "${url}" is invalid`
            });
        }
    };
})();
