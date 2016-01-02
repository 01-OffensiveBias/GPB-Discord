(function () {
    'use strict';

    var fs = require('fs');

    // Command loader
    fs.readFile(__dirname + '/enabled.json', (err, data) => {
        if (err) {
            // TODO Handle error
        }

        // TODO Validate and handle errors
        JSON.parse(data).forEach((v) => module.exports[v] = require(`${__dirname}/${v}.js`));
    });
})();
