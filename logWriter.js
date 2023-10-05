const fs = require("fs");

function createLog(logName, message) {
  fs.writeFile(logName, message, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de log:", err);
    }
  });
}
function writeLogLine(logName, message) {
  fs.appendFile(logName, message, (err) => {
    if (err) {
      console.error("Error al escribir en el archivo de log:", err);
    }
  });
}
module.exports = { writeLogLine, createLog };
