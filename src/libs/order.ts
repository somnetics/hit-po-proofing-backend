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
  endPoint: (process.env["S3_CLIENT_ENDPOINT"] as string) || "",
  port: Number(process.env["S3_CLIENT_PORT"]) || 0,
  useSSL: Boolean(String(process.env["S3_CLIENT_USESSL"]).toLowerCase() === "true") || false,
  accessKey: (process.env["S3_CLIENT_ACCESSKEY"] as string) || "",
  secretKey: (process.env["S3_CLIENT_SECRETKEY"] as string) || ""
};

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
        throw new Error("Invalid or empty data");
      }

      // save the base64 image file stream to the bucket
      const bobImage = await s3.putFileStream(process.env["S3_BUCKET"] as string, data.poDocument, `${data.orderNumber}.png`);
      console.log(bobImage);

      // save the base64 travelerDocument file stream to the bucket
      const htmlContent = typeof data.travelerDocument === "object"
         ? JSON.stringify(data.travelerDocument) // Convert object to string
         : String(data.travelerDocument);        // Ensure it's a string

      const bobHtml = await s3.putFileStream(process.env["S3_BUCKET"] as string, htmlContent, `${data.orderNumber}.html`);
 
      console.log(typeof bobHtml);

      // if object
      if (typeof bobImage === "object") {
        // get row
        const row: any = {
          id: data.orderNumber,
          travelerDocument: JSON.stringify(data.travelerDocument),
          poOverlayBlocks: JSON.stringify(data.poOverlayBlocks),
          checkList: JSON.stringify(data.checkList).replace(/\\"/g, ""),   
          bizzRuleUrl: data.bizzRuleUrl,
          userName: data.userName,
          operatorName: data.operatorName
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
    const order_by = (options["order_by"]?.toString() || "ord.createdOn:desc").split(":");

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

    // let field conditions
    const conditions: string[] = [];

    try {
      // if struct is defined
      if (typeof struct !== "undefined") {
        // get conditions
        createCondition(conditions, options, struct);
      }

      const { results, total } = await mysql
        .from(`${this.tableName} ord`)
        .select("id, userName, operatorName, createdOn, modifyOn")
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

  // get data
  async get(id: string): Promise<any> {
    try {
      if (typeof id !== "undefined" && id.trim() !== "") {
        // Fetch the order details from the database
        const { result, total } = await mysql
          .table(this.tableName)
          .select("*")
          .where(`id = '${id}'`)
          .one();

        // if record exists
        if (total > 0) {
          // get file stream
          const fileStream = await s3.getFileStream(process.env["S3_BUCKET"] as string, `${id}.png`);

          // return data
          return { result: { ...result, poDocument: fileStream }, total: total, status: "success" };
        } else {
          // return data
          return { message: "Order not found", status: "error" };
        }
      } else {
        // return results
        return { result: "Order number cannot be empty.", status: "error" };
      }
    } catch (err: any) {
      // on error
      console.error("Error fetching order:", err.message);

      // return data
      return { message: err.message, status: "error" };
    }
  }
}