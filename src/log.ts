import * as fs from 'fs';
const stathat = require('stathat')

const logger  = require('winston')
const logsene = require('winston-logsene')

logger.add(logsene, {
  token: process.env.sematext,
});

export default {
	info: (text: string) => {
		if (process.env.production) {
			logger.info(text)
		} else {
			console.log(text)
		}
	},

	warn: (text: string) => {
		if (process.env.production) {
			stathat.trackEZCount("artonge.c@gmail.com", "warning", 1);
			logger.warn(text)
		} else {
			console.warn(text)
		}
	},

	error: (text: any) => {
		if (process.env.production) {
			stathat.trackEZCount("artonge.c@gmail.com", "error", 1);
			logger.error(text)
		} else {
			console.error(text)
		}
	}
}
