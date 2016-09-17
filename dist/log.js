"use strict";
var fs = require('fs');
function log(text, file) {
    if (file === void 0) { file = "log.json"; }
    file = "logs/" + file;
    if (typeof text === "object")
        text = JSON.stringify(text);
    fs.appendFile(file, "-------------------" + new Date() + "-------------------\n");
    fs.appendFile(file, text + "\n");
}
exports.log = log;
function success(text) { log(text, "success.json"); }
exports.success = success;
function error(text) { log(text, "error.json"); }
exports.error = error;
