// import function
import { createCondition, decrypt } from "../libs/functions";

// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import mysql class
import MySQL from "../libs/mysql";

// get mysql instance
const mysql = new MySQL();

// set table name
const tableName = "role";

// define search route
router.get("/search", async (req: Request, res: Response) => {
  // get offset
  const offset = Number(req.query["page"]) || 1;

  // get limit
  const limit = Number(req.query["size"]) || 50;

  // get order_by
  const order_by = (req.query["order_by"]?.toString() || "rolename:asc").split(":");

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
  const conditions: string[] = [`deleted = ${trash == "true" ? 1 : 0}`];

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
    const data = await mysql
      .table(tableName)
      .where(conditions.join(" AND "))
      .offset(offset)
      .limit(limit)
      .sort(order_by[0] as string, order_by[1] as string)
      .many();

    // response json data
    res.json(data);
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ results: [], total: 0, message: err.message, status: "error" });
  }
});

// define create record route
router.post("/", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // create new patient
    if (req.body.id.trim() == "") {
      // get data
      const data = {
        rolename: req.body.rolename.trim(),
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
        message: "Role created successfully",
        status: "success",
      };
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

// define update record route
router.put("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  try {
    // if id is supplied
    if (typeof req.params["id"] !== "undefined") {
      // get patient
      const patient = await mysql.table(tableName).exists(req.params["id"]);

      // if patient exists
      if (patient.exists) {
        // if restore
        if (
          typeof req.body.restore != "undefined" &&
          req.body.restore == true
        ) {
          // restore patient from trash
          await mysql
            .table(tableName)
            .fields(["deleted"])
            .values([0])
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "Role restored successfully",
            status: "success",
          };
        } else {
          // get data
          const data = {
            rolename: req.body.rolename.trim(),
            status: req.body.status,
            privileges: JSON.stringify(patient.result.privileges || {}).replaceAll("\\\\", "\\"),
          };

          // if 
          if (typeof req.body["privileges"] !== "undefined") {
            // get privileges
            let privileges = req.body["privileges"];

            // if diagnosis is defined
            data.privileges = JSON.stringify(JSON.parse(privileges)).replaceAll("\\\\", "\\");
          }

          // update patient
          await mysql
            .table(tableName)
            .fields(Object.keys(data))
            .values(Object.values(data))
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "Role updated successfully",
            status: "success",
          };
        }
      } else {
        // set response
        response = { message: "Role not found", status: "error" };
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
      // get patient
      const { result, total } = await mysql
        .from(tableName)
        .where(`id = '${req.params["id"]}'`)
        .one();

      // check patient exists
      if (total) {
        // set response
        response = result;
      } else {
        // set response
        response = { message: "Role does not exists", status: "error" };
      }
    } else {
      // set response
      response = { message: "Role Id cannot be empty", status: "error" };
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
      // get patient
      const patient = await mysql
        .table(tableName)
        .exists(req.params["id"]);

      // check patient exists
      if (patient.exists) {
        // check deleted status
        if (patient.result.deleted == 1) {
          // delete role
          await mysql
            .table(tableName)
            .where(`id = '${req.params["id"]}'`)
            .delete();

          // set response
          response = {
            message: "Role deleted successfully",
            status: "success",
          };
        } else if (patient.result.deleted == 0) {
          // soft delete role
          await mysql
            .table(tableName)
            .fields(["deleted"])
            .values(["1"])
            .where(`id = '${req.params["id"]}'`)
            .update();

          // set response
          response = {
            message: "Role moved to trash",
            status: "warning",
          };
        }
      } else {
        // set response
        response = { message: "Role does not exists", status: "error" };
      }
    } else {
      // set response
      response = { message: "Role Id cannot be empty", status: "error" };
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

export default router;
