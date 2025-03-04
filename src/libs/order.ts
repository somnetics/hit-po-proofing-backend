// import logger
import logger from "./logger";

//  import functions
import { createCondition, properCase } from "./functions";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

// import required modules
import S3, { s3Options } from "./s3";

// s3 optionjs
const options: s3Options = {
  endPoint: process.env["S3_CLIENT_ENDPOINT"] as string || "",
  port: Number(process.env["S3_CLIENT_PORT"]) || 0,
  useSSL: Boolean(String(process.env["S3_CLIENT_USESSL"]).toLowerCase() === "true") || false,
  accessKey: process.env["S3_CLIENT_ACCESSKEY"] as string || "",
  secretKey: process.env["S3_CLIENT_SECRETKEY"] as string || "",
}

// create s3 instance
const s3 = new S3(options);

// export Order class
export default class Order {
  // set table name
  tableName: string;

  // on initiate
  constructor() {
    this.tableName = "orders";
  }

  // save data
  async save(data: any): Promise<any> {
    try {
      if (typeof data === "undefined") {
        throw new Error('Invalid or empty data');
      }

      // save the base64 image file stream to the bucket
      const bobImage = await s3.putFileStream(process.env["S3_BUCKET"] as string, data.poDocument, `${data.orderNumber}.png`);

      // if object
      if (typeof bobImage === "object") {
        // get row
        const row: any = {
          id: data.orderNumber,
          travelerDocument: JSON.stringify(data.travelerDocument),
          poOverlayBlocks: JSON.stringify(data.poOverlayBlocks),
          checkList: JSON.stringify(data.checkList),
          bizzRuleUrl: data.bizzRuleUrl,
          userName: data.userName
        };

        // get orders
        const orders = await mysql.table(this.tableName).exists(row.id);

        // if order exists and order_id present
        if (!orders.exists && row.id) {
          // update order
          await mysql
            .into(this.tableName)
            .fields(Object.keys(row))
            .values(Object.values(row))
            .insert();
        } else {
          // create order    
          await mysql
            .table(this.tableName)
            .fields(Object.keys(row))
            .values(Object.values(row))
            .where(`id = '${row.id}'`)
            .update();
        }

        // response json data
        return { message: "Order updated successfully.", status: "success" };
      } else {
        // on error
        logger(`[error]: Unable to store in s3`);

        // response json data
        return { message: "Unable to store in s3", status: "error" };
      }
    } catch (e: any) {
      // on error
      logger(`[error]: ${e.message}`);

      // response json data
      return { message: e.message, status: "error" };
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

      // return json data
      return { results: results, total: total, message: "Search done!", status: "success" };
    } catch (err: any) {
      // on error
      console.error(err.message);

      // return json data
      return { results: [], total: 0, message: err.message, status: "error" };
    }
  }
}