import fs from "fs";
import path from "path";

export function setLogPath(logName) {
  return path.join("logs", logName)
}

export function createLogDir() {
  if (!fs.existsSync("logs")) {
    fs.mkdirSync("logs");
  }
}

export function setLogName(scraperName) {
  const dateTime = new Date();
  const date = "-" + dateTime.toISOString().split("T")[0] + "-";
  const time = dateTime
    .toTimeString()
    .split(" ")[0]
    .replace(/:/g, " -")
    .replace(/\s+/g, "");
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
  fs.appendFile(logName, "\n"+message, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de log:", err);
    }
  });
}
