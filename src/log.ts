import * as fs from 'fs';

export function log(text: any, file: string = "log.json") {
  // return; // prevent log, to remove if debug

  file = "logs/"+file;

  if (typeof text === "object") text = JSON.stringify(text);

  fs.appendFile(file, "-------------------" + new Date() + "-------------------\n");
  fs.appendFile(file, text + "\n");
}

export function success(text: string) { log(text, "success.json"); }
export function error  (text: string) { log(text, "error.json"  ); }
