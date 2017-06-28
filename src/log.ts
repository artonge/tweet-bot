import * as fs from 'fs';
const stathat = require('stathat')

class Log {

	private log(text: any, file: string = "log.json") {
		// If in production on heroku don't log in files
		if (process.env.production) {
			switch (file) {
				case "warning.json":
					stathat.trackEZCount("artonge.c@gmail.com", "warning", 1);
					console.warn(text)
					break
				case "error.json":
					stathat.trackEZCount("artonge.c@gmail.com", "error", 1);
					console.error(text)
					break
				default:
					console.log(text)
			}
		} else {
			file = "logs/"+file;
			if (typeof text === "object") text = JSON.stringify(text);
			fs.appendFile(file, new Date() + " | " + text + "\n");
		}
	}

	engagement = (text: string)=> { this.log(text, "engagement.json"); }
	warning    = (text: string)=> { this.log(text, "warning.json"   ); }
	timeline   = (text: string)=> { this.log(text, "timeline.json"  ); }
	error      = (error: any  )=> { this.log(`error: [${error.code}] ${error.message}`, "error.json"); }
}


export const log = new Log();
