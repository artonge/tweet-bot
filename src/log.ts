import * as fs from 'fs';


class Log {

	private log(text: any, file: string = "log.json") {
	  file = "logs/"+file;

	  if (typeof text === "object") text = JSON.stringify(text);

	  fs.appendFile(file, new Date() + " | " + text + "\n");
	}

	engagement(text: string) { this.log(text, "engagement.json"); }
	error     (text: string) { this.log(text, "error.json"     ); }
	warning   (text: string) { this.log(text, "warning.json"   ); }
	timeline  (text: string) { this.log(text, "timeline.json"     ); }
}


export const log = new Log();
