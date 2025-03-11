// import logger
import logger from "./logger";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

//  import functions
import { createCondition, properCase } from "./functions";

// export issues class
export default class issues {
  // set table name
  tableName: string;

  // on initiate
  constructor() {
    this.tableName = "issue";
  }

  // save issues
  async save(data: any): Promise<any> {
    try {
      if (!data) {
        throw new Error("Invalid or empty data");
      }

      // Prepare the row for insertion
      const row: any = {
        // id: data.orderNumber || data.soNumber,
        assignTo: data.assignTo || null,
        poNumber: data.poNumber || null,
        soNumber: data.soNumber || null,
        userName: data.userName || null,
        problemDetails: data.problemDetails || null,
        problemOccourIn: data.problemOccourIn || null,
        shipDate: data.shipDate.trim() != "" ? data.shipDate : "NULL",
        remarks: data.remarks || null
      };

      // Check if an issue with the same PO number exists
      const { result, total } = await mysql
        .table(this.tableName)
        .where(`poNumber = '${data.poNumber}'`)
        .one();
      // console.log(result);

      if (total === 0) {
        const insertQuery = `INSERT INTO ${this.tableName} (${Object.keys(
          row
        ).join(", ")}) 
        VALUES (${Object.values(row)
            .map((v) => `'${v}'`)
            .join(", ")})`;
        console.log(`[Executing Query]: ${insertQuery}`);
        // Insert new issue
        await mysql
          .into(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .insert();
      } else {
        // Update existing issue
        await mysql
          .table(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .where(`id = '${result.id}'`)
          .update();
      }

      return { message: "Issue saved successfully.", status: "success" };
    } catch (e: any) {
      logger(`[error]: ${e.message}`);
      return { message: e.message, status: "error" };
    }
  }

  // get data
  async get(poNumber: string): Promise<any> {
    try {
      if (!poNumber || poNumber.trim() === "") {
        throw new Error("Invalid or empty PO number");
      }

      // Fetch the field details from the database
      const data: any = await mysql
        .table(this.tableName)
        .where(`poNumber = '${poNumber}'`)
        .one();

      // Ensure data exists
      if (!data) {
        return { message: "Order not found", status: "error" };
      }

      return {
        result: data, // Directly return the result without extra nesting
        status: "success"
      };
    } catch (err: any) {
      console.error("Error fetching order:", err.message);
      return { message: err.message, status: "error" };
    }
  }

  // search data
  async search(options: any): Promise<any> {
    // get offset
    const offset = Number(options["page"]) || 1;

    // get limit
    const limit = Number(options["size"]) || 50;

    // get order_by
    const order_by = (options["order_by"]?.toString() || "ord.id:asc").split(":");

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

    // // get field range
    // const range = options["range"]?.toString();

    // // delete range property
    // delete options["range"];

    // // get field name
    // const name = options["name"]?.toString();

    // // delete name property
    // delete options["name"];

    // // get field modified_by
    // const modified_by = options["modified_by"]?.toString();

    // // delete modified_by property
    // delete options["modified_by"];

    // // get field version
    // const version = options["version"]?.toString();

    // // delete version property
    // delete options["version"];

    // let field conditions
    // const conditions: string[] = [`ord.deleted = ${trash == "true" ? 1 : `0 AND frm.current = 1`}`];
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

      // modified_by search
      // if (typeof modified_by !== "undefined") {
      //   // push stack condition
      //   if (modified_by.trim() !== "") conditions.push(`frm.modified_by = '${modified_by}'`);
      // }

      // // version search
      // if (typeof version !== "undefined") {
      //   // push version condition
      //   if (version.trim() !== "") conditions.push(`frm.version = '${properCase(version)}'`);
      // }

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

  async getSuggestions(remarks: string | undefined): Promise<any> {
    try {
      // get json data
      const { results, total } = await mysql
        .table(this.tableName)
        .select("distinct remarks")
        .where(`remarks LIKE '%${remarks}%'`)
        .offset(0)
        .limit(20)
        .sort("remarks", "asc")
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
