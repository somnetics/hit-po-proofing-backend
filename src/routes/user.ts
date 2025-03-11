// import function
import { createCondition, encrypt, decrypt } from "../libs/functions";

// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import mysql class
import MySQL from "../libs/mysql";

// get mysql instance
const mysql = new MySQL();

// set table name
const tableName = "user";

// import user class
import User from "../libs/user";

// init user class object
const user = new User();

// define search route
router.get("/search", async (req: Request, res: Response) => {
  // get offset
  const offset = Number(req.query["page"]) || 1;

  // get limit
  const limit = Number(req.query["size"]) || 50;

  // get order_by
  const order_by = (req.query["order_by"]?.toString() || "usr.fullname:asc").split(":");

  // get trash state
  const trash = req.query["trash"];

  // get field struct
  const struct = req.query["struct"]?.toString();

  // delete page property
  delete req.query["page"];

  // delete limit property
  delete req.query["size"];

  // delete limit property
  delete req.query["order_by"];

  // delete trash property
  delete req.query["trash"];

  // delete struct property
  delete req.query["struct"];

  // let field conditions
  const conditions: string[] = [`usr.deleted = ${trash == "true" ? 1 : 0}`, 'usr.is_super_user = 0'];

  try {
    // if struct is defined
    if (typeof struct !== "undefined") {
      // get conditions
      createCondition(conditions, req.query, struct);
    } else {
      // loop fields value
      for (const [key, value] of Object.entries(req.query)) {
        // add field condition
        conditions.push(`${key} = '${value}'`);
      }
    }

    // get json data
    const { results, total } = await mysql
      .table("user usr LEFT JOIN role rol ON rol.id = usr.role")
      .select("usr.*, rol.rolename")
      .where(conditions.join(" AND "))
      .offset(offset)
      .limit(limit)
      .sort(order_by[0] as string, order_by[1] as string)
      .many();

    // response json data
    res.json({ results: results, total: total });
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ results: [], total: 0, message: err.message, status: "error" });
  }
});

// define suggestion route
router.get("/suggestion", async (req: Request, res: Response) => {
  try {
    // get fullname
    const fullname = req.query["fullname"]?.toString() || "";

    // create project
    const { results, total } = await user.getUserSuggestion(fullname)

    // response json data
    res.json({ results: results, total: total });
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ message: err.message, id: undefined, status: "error" });
  }
});

// define user auth route
router.post("/auth", async (req: Request, res: Response) => {
  if (
    typeof req.body.username !== "undefined" &&
    typeof req.body.password !== "undefined"
  ) {
    // check user exists
    const { result, total } = await mysql
      .table("user usr LEFT JOIN role rol ON rol.id = usr.role")
      .select("usr.*, rol.rolename, rol.privileges")
      .where(`(username = '${req.body.username}' OR email = '${req.body.username}')`)
      .one();

    // if user exists
    if (total) {
      // if user exists
      if (decrypt(result.password, result.id) === req.body.password) {
        // if user is active
        if (result.status == "Active") {
          // password data
          delete result.password;

          // response with user object
          res.json({
            status: "success",
            message: result
          });
        } else {
          // response with error
          res.json({
            status: "error",
            message: "user is not active"
          });
        }
      } else {
        // response with error
        res.json({
          status: "error",
          message: "User password is not valid"
        });
      }
    } else {
      // response with error
      res.json({
        status: "error",
        message: "User does not exists or username is not valid"
      });
    }
  } else {
    // response with error
    res.json({
      status: "error",
      message: "Username or password is not supplied"
    });
  }
});

// define create record route
router.post("/", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // generate uuid
    const id = mysql.uuid();

    // get data
    const data = {
      id: id,
      username: req.body.username.trim(),
      fullname: req.body.fullname.trim(),
      password: encrypt("password", id),
      phone: req.body.phone.trim(),
      email: req.body.email.trim(),
      role: req.body.role,
      status: req.body.status
    };

    // get result
    await mysql
      .into(tableName)
      .fields(Object.keys(data))
      .values(Object.values(data))
      .insert();

    // response json data
    response = {
      message: "User created successfully",
      status: "success",
    };
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    response = { message: err.message, status: "error" };
  }

  // response json
  res.json(response);
});

// define update record route
router.put("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // if id is supplied
    if (typeof req.params["id"] !== "undefined") {
      // get user
      const user = await mysql.table(tableName).exists(req.params["id"]);

      // if user exists
      if (user.exists) {
        // if restore
        if (
          typeof req.body.restore != "undefined" &&
          req.body.restore == true
        ) {
          // restore user from trash
          await mysql
            .table(tableName)
            .fields(["deleted"])
            .values([0])
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "User restored successfully",
            status: "success",
          };
        } else {
          // get data
          const data = {
            username: req.body.username.trim(),
            fullname: req.body.fullname.trim(),
            phone: req.body.phone.trim(),
            email: req.body.email.trim(),
            role: req.body.role,
            status: req.body.status
          };

          // update user
          await mysql
            .table(tableName)
            .fields(Object.keys(data))
            .values(Object.values(data))
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "User updated successfully",
            status: "success",
          };
        }
      } else {
        // set response
        response = { message: "User not found", status: "error" };
      }
    }
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    response = { message: err.message, status: "error" };
  }

  // response json
  res.json(response);
});

// define get by id route
router.get("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // if id is supplied
    if (typeof req.params["id"] !== "undefined") {
      // get user
      const { result, total } = await mysql
        .from(tableName)
        .where(`id = '${req.params["id"]}'`)
        .one();

      // check user exists
      if (total) {
        // set response
        response = result;
      } else {
        // set response
        response = { message: "User does not exists", status: "error" };
      }
    } else {
      // set response
      response = { message: "User Id cannot be empty", status: "error" };
    }
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    response = { message: err.message, status: "error" };
  }

  // response json
  res.json(response);
});

// define delete by id route
router.delete("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // if id is supplied
    if (typeof req.params["id"] !== "undefined") {
      // get user
      const user = await mysql
        .table(tableName)
        .exists(req.params["id"]);

      // check user exists
      if (user.exists) {
        // check deleted status
        if (user.result.deleted == 1) {
          // delete user
          await mysql
            .table(tableName)
            .where(`id = '${req.params["id"]}'`)
            .delete();

          // set response
          response = {
            message: "User deleted successfully",
            status: "success",
          };
        } else if (user.result.deleted == 0) {
          // soft delete user
          await mysql
            .table(tableName)
            .fields(["deleted"])
            .values(["1"])
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "User moved to trash",
            status: "warning",
          };
        }
      } else {
        // set response
        response = { message: "User does not exists", status: "error" };
      }
    } else {
      // set response
      response = { message: "User Id cannot be empty", status: "error" };
    }
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ message: err.message, status: "error" });
  }

  // response json
  res.json(response);
});

// define update record route
router.put("/update-password/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // if id is supplied
    if (typeof req.params["id"] !== "undefined") {
      // get user
      const user = await mysql.table(tableName).exists(req.params["id"]);

      // // if user exists
      if (user.exists) {
        // if user exists
        if (decrypt(user.result.password, user.result.id) === req.body.current_password || typeof req.body.current_password === "undefined") {
          // if user is active
          if (user.result.status === "Active") {
            // if new password match with confirm password
            if (req.body.new_password === req.body.confirm_password) {
              // if current password match with confirm password
              if (decrypt(user.result.password, user.result.id) !== req.body.confirm_password) {
                // restore user from trash
                await mysql
                  .table(tableName)
                  .fields(["password"])
                  .values([encrypt(req.body.confirm_password, user.result.id)])
                  .where(`id = '${user.result.id}'`)
                  .update();

                // set response
                response = {
                  status: "success",
                  message: "Password updated successfully"
                };
              } else {
                // set response
                response = {
                  status: "error",
                  message: "Password can't be same as current password"
                };
              }
            } else {
              // set response
              response = {
                status: "error",
                message: "Password doesn't match with confirm password"
              };
            }
          } else {
            // set response
            response = {
              status: "error",
              message: "user is not active"
            };
          }
        } else {
          // set response
          response = {
            status: "error",
            message: "Current password is not valid"
          };
        }
      } else {
        // set response
        response = {
          status: "error",
          message: "user does not exists"
        };
      }
    } else {
      // set response
      response = {
        status: "error",
        message: "User id is not supplied"
      };
    }
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    response = {
      status: "error",
      message: err.message
    };
  }

  // response json
  res.json(response);
});

export default router;