import fs from "fs";
import path from "path";

export function setLogPath(logName) {
  return path.join("logs", logName);
}

export function createLogDir() {
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }
}

export function setLogName(scraperName) {
  const now = new Date();
  const actualHour = now.getHours();
  const actualMins = now.getMinutes();
  const actualSecs = now.getSeconds();
  const date = "-" + now.toISOString().split("T")[0] + "-";
  const time = now
    .toTimeString()
    .split(" ")[0]
    .replace(/:/g, " -")
    .replace(/\s+/g, "");
  //const time = actualHour + ":" + actualMins + ":" + actualSecs;
  return scraperName + date + time + ".txt";
}

export function createLog(logName, message) {
  fs.writeFile(logName, message, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de log:", err);
    }
  });
}

export function writeLogLine(logName, message) {
  const now = new Date();
  const actualHour = now.getHours();
  const actualMins = now.getMinutes();
  const actualSecs = now.getSeconds();
  fs.appendFile(
    logName,
    "\n" +
      "Tiempo: " +
      actualHour +
      ":" +
      actualMins +
      ":" +
      actualSecs +
      "  " +
      message,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
}
