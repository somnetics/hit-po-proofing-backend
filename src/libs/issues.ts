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

      if (total === 0) {
        // Insert new issue
        await mysql
          .into(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .insert();

        // response json data
        return { message: "Issue logged successfully.", status: "success" };
      } else {
        // Update existing issue
        await mysql
          .table(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .where(`id = '${result.id}'`)
          .update();

        // response json data
        return { message: "Issue updated successfully.", status: "success" };
      }
    } catch (err: any) {
      // on error
      logger(`[error]: ${err.message}`);

      // response json data
      return { message: err.message, status: "error" };
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
      // on error
      logger(`[error]: ${err.message}`);

      // response json data
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

    console.log(options);

    // let field conditions
    const conditions: string[] = [`isu.assignTo = '${options["assignTo"]}'`];

    try {
      // if struct is defined
      if (typeof struct !== "undefined") {
        // get conditions
        createCondition(conditions, options, struct);
      }   

      const { results, total } = await mysql
        .from(`${this.tableName} isu`)
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