// require nodemailer module
const nodemailer = require("nodemailer");

// export email module
var self = module.exports = {
  settings: {},
  // init email
  init: (settings) => {
    // smtp settings
    self.settings = {
      host: settings.host, // smtp host
      port: settings.port, // smtp port
      secure: settings.secure // true for 465, false for other ports
    }

    // is auth
    if (typeof settings.auth !== "undefined" && typeof settings.auth.user !== "undefined" && !functions.empty(settings.auth.user) && typeof settings.auth.pass !== "undefined" && !functions.empty(settings.auth.pass)) {
      // set auth
      self.settings.auth = {
        user: settings.auth.user, // auth auth username
        pass: settings.auth.pass  // auth auth password
      }
    } else {
      // remove auth
      delete self.settings.auth;
    }

    // return self
    return self;
  },
  // send email
  send: (options, callback) => {
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport(self.settings);

    // send mail to the manager
    transporter.sendMail(options, (err, info) => {
      // return info
      if (typeof callback === "function") callback(err, info);
    });
  }
}
