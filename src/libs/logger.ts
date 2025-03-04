// store console.log
const logger = console.log;

// import moment module
import moment from "moment";

// override console log
console.log = function () {
  // get arguments
  const args = Array.from(arguments);

  // let error
  const e = new Error();

  // get stack from error
  if (typeof e.stack !== "undefined") {
    // get frame
    const frame: string = e.stack.split("\n")[2] || ""; // change to 3 for grandparent func

    // check for console data
    if (typeof frame !== "undefined" && args.length > 0 || args[0].trim().length > 0) {
      // new line
      logger("\n\r");

      // get called at info
      logger(`[${moment().format("DD-MM-YYYY HH:mm:ss")}] - Called ${frame.trim()}`);

      // new line
      logger(`Data:`, ...args);
    } else {
      // new line
      logger("\n\r");
    }
  }
}

// export log console
export default logger;