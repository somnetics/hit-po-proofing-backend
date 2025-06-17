// import dotenv
import dotenv from "dotenv";
// import cors from "cors";

// load .env config
dotenv.config();

// import express
import express, { Express } from "express";

// get exporess app
const app: Express = express();

// enable case sensitive routing
app.set("case sensitive routing", false);

// url encode body-parser
app.use(
  express.urlencoded({
    limit: "100mb",
    extended: true
  })
);

// url encode body-parser JSON
app.use(express.json({ limit: "100mb" }));

// get app port
const port = Number(process.env["PORT"]);

// import logger
import logger from "./libs/logger";

// import user router module
import user from "./routes/user";

// use user router module
app.use("/user", user);

// import role router module
import role from "./routes/role";

// use user router module
app.use("/role", role);

// import order router module
import order from "./routes/orders";

// use order router module
app.use("/orders", order);

// import order router module
import fields from "./routes/fields";

// use order router module
app.use("/fields", fields);

// import order router module
import issues from "./routes/issues";

// use order router module
app.use("/issues", issues);

// import order router module
import operator from "./routes/operator";

// use order router module
app.use("/operator", operator);

// import order router module
import reports from "./routes/reports";

// use order router module
app.use("/reports", reports);

// listen to server
app.listen(port, "0.0.0.0", () => {
  logger(`[server]: Server is running at http://localhost:${port}`);
});