import * as fs from "fs";

// import stathat from "stathat";
// import * as logger from "winston";
// import logsene from "winston-logsene";

// logger.add(logsene, {
//   token: process.env.sematext
// });

var StatsD = require("node-dogstatsd").StatsD;
const dogstatsd = new StatsD();

export default {
  info: (text: string) => {
    if (process.env.production) {
      // logger.info(text);
    } else {
      console.log(text);
    }
  },

  warn: (text: string) => {
    if (process.env.production) {
      dogstatsd.increment("warning");
      // logger.warn(text);
    } else {
      console.warn(text);
    }
  },

  error: (text: any) => {
    if (process.env.production) {
      dogstatsd.increment("error");
      // logger.error(text);
    } else {
      console.error(text);
    }
  }
};
