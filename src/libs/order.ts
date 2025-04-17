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
  useSSL:
    Boolean(String(process.env["S3_CLIENT_USESSL"]).toLowerCase() === "true") ||
    false,
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
      const bobImage = await s3.putFileStream(
        process.env["S3_BUCKET"] as string,
        data.poDocument,
        `${data.orderNumber}.png`
      );

      // if object
      if (typeof bobImage === "object") {
        // get row
        const row: any = {
          id: data.orderNumber,
          travelerDocument: JSON.stringify(data.travelerDocument).replace(/'/g, "\\'").replace(/\\"/g, ""),
          poOverlayBlocks: JSON.stringify(data.poOverlayBlocks).replace(/'/g, "\\'").replace(/\\"/g, ""),          
          checkList: JSON.stringify(data.checkList).replace(/'/g, "\\'").replace(/\\"/g, ""),
          bizzRuleUrl: data.bizzRuleUrl,
          userName: data.userName,
          operatorName: data.operatorName,
          allRects: JSON.stringify(data.allRects).replace(/'/g, "\\'").replace(/\\"/g, "")
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
    const order_by = (
      options["order_by"]?.toString() || "ord.createdOn:desc"
    ).split(":");

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

  // download data as Excel
  async download(options: any): Promise<any> {
    try {
      // 1. Extract pagination and sorting parameters from the request options
      const offset = Number(options["page"]) || 1; // Default to page 1
      const limit = Number(options["size"]) || 50; // Default to 50 items per page
      const order_by = (options["order_by"]?.toString() || "isu.id:asc").split(":"); // Default sort by 'isu.id' ascending
      const struct = options["struct"]?.toString(); // Optional filter structure

      // 2. Remove special keys so they don’t interfere with SQL filters
      delete options["page"];
      delete options["size"];
      delete options["order_by"];
      delete options["trash"];
      delete options["struct"];

      // 3. Create an array of SQL WHERE conditions based on filters
      const conditions: string[] =
        typeof options["operatorName"] !== "undefined"
          ? [`isu.operatorName LIKE '%${options["operatorName"]}%'`]
          : [];

      // 4. Add more conditions dynamically if struct is defined
      if (typeof struct !== "undefined") {
        createCondition(conditions, options, struct);
      }

      // 5. Define only the keys you want to include in the Excel export
      const allowedKeys = [
        "id",
        // "travelerDocument", // Commented out: exclude this column
        "bizzRuleUrl",
        "userName",
        "operatorName",
        "createdOn",
        "modifyOn"
      ];

      // 6. Fetch filtered and sorted data from the MySQL database
      const { results, total } = await mysql
        .select(allowedKeys.map((key) => `isu.${key}`)) // Only select allowed columns
        .from(`${this.tableName} isu`) // Main table alias
        .where(conditions.join(" AND ")) // Apply conditions as AND logic
        .offset(offset) // Apply pagination offset
        .limit(limit) // Limit the number of rows
        .sort(order_by[0], order_by[1]) // Sort by requested column and order
        .many(); // Fetch many results

      // 7. If no records found, return early
      if (!results || results.length === 0) {
        return {
          message: "No data found",
          status: "no_data",
          total: 0,
          results: []
        };
      }

      // 8. Initialize ExcelJS workbook and worksheet
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Orders");

      // 9. Map column keys to friendly header names for the Excel sheet
      const headerMap: Record<string, string> = {
        id: "Po Number",
        // travelerDocument: "Traveler Document", // Excluded field
        bizzRuleUrl: "BizzRule Url",
        userName: "UserName",
        operatorName: "Operator Name",
        createdOn: "Created On",
        modifyOn: "Modify On"
      };

      // 10. Define worksheet columns based on allowed keys and headerMap
      worksheet.columns = allowedKeys.map((key) => ({
        header: headerMap[key], // Column name in Excel
        key: key,               // Key used to map values
        width: 20               // Column width
      }));

      // 11. Add each row of result data into the worksheet
      results.forEach((row: any) => {
        const filteredRow: any = {};
        allowedKeys.forEach((key) => {
          filteredRow[key] = row[key]; // Include only allowed fields
        });
        worksheet.addRow(filteredRow); // Add filtered row to sheet
      });

      // 12. Generate an Excel buffer (in-memory binary file)
      const buffer = await workbook.xlsx.writeBuffer();

      // 13. Return the Excel file buffer with metadata
      return {
        buffer,
        fileName: `Orders_${Date.now()}.xlsx`, // Dynamic filename
        status: "success"
      };
    } catch (err: any) {
      // 14. Handle and log any unexpected errors
      console.error(err.message);
      return { message: err.message, status: "error", results: [], total: 0 };
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
          const fileStream = await s3.getFileStream(
            process.env["S3_BUCKET"] as string,
            `${id}.png`
          );

          // return data
          return {
            result: { ...result, poDocument: fileStream },
            total: total,
            status: "success"
          };
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
