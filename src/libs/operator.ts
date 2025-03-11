// import logger
import logger from "./logger";

//  import functions
import { createCondition, properCase } from "./functions";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

// export operator class
export default class Operator {
  // set table name
  tableName: string;

  // on initiate
  constructor() {
    this.tableName = "operator";
  }

  async save(data: any): Promise<any> {
    try {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid or empty data!");
      }

      const row = {
        fullName: properCase(data.fullName.replace(/\s+/g," ").trim())
      };

      const { result, total } = await mysql
        .table(this.tableName)
        .select("*")
        .where(`fullName = '${row.fullName}'`)
        .one();

      if (total > 0) {
        if (result) {
          await mysql
            .table(this.tableName)
            .fields(Object.keys(row))
            .values(Object.values(row))
            .where(`id = '${result.id}'`)
            .update();

          return {
            message: "operator updated successfully.",
            status: "success"
          };
        }
      }

      // Insert a new if fullName exists
      await mysql
        .into(this.tableName)
        .fields(Object.keys(row))
        .values(Object.values(row))
        .insert();
      return { message: "operator saved successfully.", status: "success" };
    } catch (error: any) {
      console.error(error);
      logger(`[error]: ${error.message}`);
      return { message: error.message, status: "error" };
    }
  }

  // search data
  async search(options: any): Promise<any> {
    // get offset
    const offset = Number(options["page"]) || 1;

    // get limit
    const limit = Number(options["size"]) || 50;

    // get order_by
    const order_by = (options["order_by"]?.toString() || "ord.id:asc").split(
      ":"
    );

    // get trash state
    const trash = options["trash"];

    // get field struct
    const struct = options["struct"]?.toString();

    // delete page property
    delete options["page"];

    // delete limit property
    delete options["size"];

    // delete limit property
    delete options["order_by"];

    // delete trash property
    delete options["trash"];

    // delete struct property
    delete options["struct"];
    const conditions: string[] = [];

    try {
      // if struct is defined
      if (typeof struct !== "undefined") {
        // get conditions
        createCondition(conditions, options, struct);
      } else {
        // add field conditions for name, url and stack
        // if (typeof name !== "undefined") conditions.push(`(ord.name LIKE '%${name}%')`);
      }

      

      const { results, total } = await mysql
        .from(`${this.tableName} ord`)
        // .select("frm.*, usr.fullname")
        .where(conditions.join(" AND "))
        .offset(offset)
        .limit(limit)
        .sort(order_by[0] as string, order_by[1] as string)
        .many();

      // return data
      return {
        results: results,
        total: total,
        status: "success"
      };
    } catch (err: any) {
      // on error
      console.error(err.message);

      // return  data
      return { results: [], total: 0, message: err.message, status: "error" };
    }
  }
}
