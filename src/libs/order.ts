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

      // if po document exists
      if (data.poDocument.trim() !== "") {
        // save the base64 image file stream to the bucket
        const bobImage = await s3.putFileStream(
          process.env["S3_BUCKET"] as string,
          data.poDocument,
          `${data.orderNumber}.png`
        );
      }

      // Parse checklist and determine if it has 'Ship To' label with MULTI-DESTINATIONS
      let multiShip = null;
      try {
        const checklistArray: { label: string; value: string | string[] }[] = Array.isArray(data.checkList)
          ? data.checkList
          : JSON.parse(data.checkList);

        const shipToEntry = checklistArray.find(
          (item: { label: string; value: string | string[] }) =>
            item.label === "Ship To" &&
            typeof item.value === "string" &&
            item.value.toLowerCase().includes("multi")
        );

        if (shipToEntry) {
          multiShip = shipToEntry.value;
        }
      } catch (e) {
        const err = e as Error;
        logger(`[warn]: Error parsing checklist for Ship To – ${err.message}`);
      }

      // get row
      const row: any = {
        id: data.orderNumber,
        travelerDocument: JSON.stringify(data.travelerDocument).replace(/'/g, "\\'").replace(/\\"/g, ""),
        // poOverlayBlocks: JSON.stringify(data.poOverlayBlocks).replace(/'/g, "\\'").replace(/\\"/g, "").replace(/\n\n/g, ""),
        poOverlayBlocks: JSON.stringify(data.poOverlayBlocks.map((b: any) => ({ ...b, text: typeof b.text === "string" ? b.text.replace(/\n\n/g, " ").replace(/\n/g, "<br>").replace(/'/g, "\\'").replace(/\\"/g, "") : b.text }))),
        xmlElement: data.xmlElementBase64.trim() !== "" ? data.xmlElementBase64.trim() : 'NULL',
        checkList: JSON.stringify(data.checkList).replace(/'/g, "\\'").replace(/\\"/g, ""),
        bizzRuleUrl: data.bizzRuleUrl,
        userName: data.userName,
        operatorName: data.operatorName,
        allRects: JSON.stringify(data.allRects).replace(/'/g, "\\'").replace(/\\"/g, ""),
        durationSec: data.durationSec || 0,
        result: JSON.stringify(data.result).replace(/'/g, "\\'").replace(/\\"/g, ""),
        // listToUse: JSON.stringify(data.listToUse).replace(/'/g, "\\'").replace(/\\"/g, ""),
        // listToUse: listToUseJson,
        // accuracyPercent: accuracy,
        multiShip: multiShip,
        foundTrue: data.foundTrue,
        foundFalse: data.foundFalse,
      };
      // console.log(data);

      // get orders
      const orders = await mysql.table(this.tableName).exists(row.id);

      // if order exists and order_id present
      if (!orders.exists && row.id) {
        // console.log(
        //   `INSERT INTO ${this.tableName} (${Object.keys(row).join(", ")}) VALUES (${Object.values(row).map(val => `'${val}'`).join(", ")})`
        // );

        // update order
        await mysql
          .into(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .insert();
      } else {
        // const setClause = Object.entries(row)
        //   .map(([key, val]) => `${key} = '${val}'`)
        //   .join(", ");

        // console.log(`UPDATE ${this.tableName} SET ${setClause} WHERE id = '${row.id}'`);

        delete row.operatorName;

        // update order
        await mysql
          .table(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .where(`id = '${row.id}'`)
          .update();
      }

      // response json data
      return { message: "Order updated successfully.", status: "success" };
    } catch (e: any) {
      // on error
      logger(`[error]: ${e.message}`);

      // response json data
      return { message: e.message, status: "error" };
    }
  }

  async checkboxToggleAll(data: any): Promise<any> {
    try {
      if (!data || !data.orderNumber || !Array.isArray(data.checkedItems)) {
        throw new Error("Invalid payload: orderNumber or checkedItems missing.");
      }

      const orderNumber = data.orderNumber;
      const listToUse = data.checkedItems;
      const listToUseJson = JSON.stringify(listToUse).replace(/'/g, "\\'").replace(/\\"/g, "");
      let foundTrueCount = 0;
      try {
        const parsed = JSON.parse(listToUseJson);
        if (Array.isArray(parsed)) {
          foundTrueCount = parsed.filter((item: any) => item.found === true).length;
        }
      } catch (err) {
        console.error("Failed to parse listToUseJson:", err);
      }

      // Fetch existing result from DB
      const { results, total } = await mysql
        .from(`${this.tableName} ord`)
        .select("ord.result")
        .where(`ord.id = '${orderNumber}'`)
        .many();

      let resultFoundTrueCount = 0;
      if (results && Array.isArray(results)) {
        try {
          results.forEach((row: any) => {
            const resultArray = typeof row.result === "string"
              ? JSON.parse(row.result)
              : row.result;

            if (Array.isArray(resultArray)) {
              resultFoundTrueCount += resultArray.filter((item: any) => item.found === true).length;
            }
          });
        } catch (err) {
          console.error("Failed to parse result column:", err);
        }
      }
      // console.log("resultFoundTrueCount", resultFoundTrueCount);
      let accuracy = 100;
      if (resultFoundTrueCount > 0) {
        // accuracy = (foundTrueCount / resultFoundTrueCount) * 100;
        accuracy = (resultFoundTrueCount > 0)
          ? Math.min((foundTrueCount / resultFoundTrueCount) * 100, 100)
          : 100;
      } else {
        accuracy = 100;
      }
      accuracy = parseFloat(accuracy.toFixed(2));
      const row: any = {
        id: orderNumber,
        listToUse: listToUseJson,
        accuracyPercent: accuracy,
      };

      // Step 3: Insert or update
      const orders = await mysql.table(this.tableName).exists(orderNumber);

      if (!orders.exists) {
        await mysql
          .into(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .insert();
      } else {
        await mysql
          .table(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .where(`id = '${orderNumber}'`)
          .update();
      }

      return { message: "Order updated successfully.", status: "success" };
    } catch (e: any) {
      logger(`[error]: ${e.message}`);
      return { message: e.message, status: "error" };
    }
  }

  async upsertOrder(data: any): Promise<any> {
    try {
      // get a JS Date
      const now = new Date();
      // format it for MySQL
      const formattedNow =
        now.toISOString().slice(0, 19).replace("T", " ");
      // console.log(formattedNow);

      // Build your row (here only id, modifyOn)
      const row: any = {
        id: data.orderNumber,
        modifyOn: formattedNow
      };

      const fields = Object.keys(row);
      const values = Object.values(row);
      const existing = await mysql.table(this.tableName).exists(data.orderNumber);

      if (!existing.exists) {
        await mysql
          .into(this.tableName)
          .fields(fields)
          .values(values)
          .insert();
      } else {
        //use parameter binding in the WHERE clause too
        await mysql
          .table(this.tableName)
          .fields(fields)
          .values(values)
          .where(`id = '${data.orderNumber}'`)
          .update();
      }

      return { message: "Order upserted successfully.", status: "success" };
    } catch (err: any) {
      // console.error("Upsert error:", err.message);
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
        .select("id, userName, operatorName, createdOn, modifyOn, durationSec, accuracyPercent,multiShip")
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
      const order_by = (options["order_by"]?.toString() || "odr.id:asc").split(":");
      const struct = options["struct"]?.toString();

      delete options["page"];
      delete options["size"];
      delete options["order_by"];
      delete options["trash"];
      delete options["struct"];

      const conditions: string[] = [];

      // Exact match for operatorName
      const operatorName = options["operatorName"];
      if (typeof operatorName !== "undefined") {
        if (Array.isArray(operatorName)) {
          const values = operatorName.map((val) => `'${val}'`).join(", ");
          conditions.push(`odr.operatorName IN (${values})`);
        } else {
          conditions.push(`odr.operatorName = '${operatorName}'`);
        }
      }

      // Exact match for userName
      const userName = options["userName"];
      if (typeof userName !== "undefined") {
        if (Array.isArray(userName)) {
          const values = userName.map((val) => `'${val}'`).join(", ");
          conditions.push(`odr.userName IN (${values})`);
        } else {
          conditions.push(`odr.userName = '${userName}'`);
        }
      }

      // Optional struct filter logic
      if (typeof struct !== "undefined") {
        createCondition(conditions, options, struct);
      }

      // Handle date range filtering
      const fromDateRaw = options["from"];
      const toDate = options["to"];

      let fromDate: string | undefined = undefined;
      if (fromDateRaw) {
        const previousDay = new Date(fromDateRaw);
        previousDay.setDate(previousDay.getDate());
        fromDate = previousDay.toISOString().split("T")[0];
      }

      if (fromDate && toDate) {
        conditions.push(`DATE(odr.createdOn) BETWEEN '${fromDate}' AND '${toDate}'`);
      } else if (fromDate) {
        conditions.push(`DATE(odr.createdOn) >= '${fromDate}'`);
      } else if (toDate) {
        conditions.push(`DATE(odr.createdOn) <= '${toDate}'`);
      }

      const allowedKeys = [
        "id",
        "bizzRuleUrl",
        "userName",
        "operatorName",
        "createdOn",
        "modifyOn",
        "durationSec",
        "accuracyPercent",
      ];

      const { results, total } = await mysql
        .select(allowedKeys.map((key) => `odr.${key}`))
        .from(`${this.tableName} odr`)
        .where(conditions.join(" AND "))
        .offset()
        .limit()
        .sort(order_by[0] as string, order_by[1] as string)
        .many();

      if (!results || results.length === 0) {
        return {
          message: "No data found",
          status: "no_data",
          total: 0,
          results: []
        };
      }

      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Orders");

      const headerMap: Record<string, string> = {
        id: "Po Number",
        bizzRuleUrl: "BizzRule Url",
        userName: "UserName",
        operatorName: "Operator Name",
        createdOn: "Created On",
        accuracyPercent: "Accuracy(%)",
        durationSec: "Duration (sec)",
        modifyOn: "Complete Order"
      };

      worksheet.columns = allowedKeys.map((key) => ({
        header: headerMap[key],
        key: key,
        width: 20
      }));

      results.forEach((row: any) => {
        const filteredRow: any = {};
        allowedKeys.forEach((key) => {
          let value = row[key];

          if (key === "createdOn" || key === "modifyOn") {
            if (value) {
              const date = new Date(value);
              value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
            }
          }

          filteredRow[key] = value;
        });
        worksheet.addRow(filteredRow);
      });

      const buffer = await workbook.xlsx.writeBuffer();

      return {
        buffer,
        fileName: `Orders_${Date.now()}.xlsx`,
        status: "success"
      };
    } catch (err: any) {
      console.error(err.message);
      return { message: err.message, status: "error", results: [], total: 0 };
    }
  }


  async getAssignedUsers() {
    try {
      // Fetch distinct user names from the current table
      const { results: userNames } = await mysql
        .from(`${this.tableName}`)
        .select("DISTINCT userName")
        .many();

      // Fetch distinct full names from the 'operator' table
      const { results: fullNames } = await mysql
        .from(`operator`)
        .select("DISTINCT fullName")
        .many();

      // Return the list of usernames and full names as arrays
      return {
        userNames: userNames.map((r: any) => r.userName),
        fullNames: fullNames.map((r: any) => r.fullName)
      };
    } catch (err: any) {
      // Log the error and throw a custom error message
      console.error("DB error:", err.message);
      throw new Error("Failed to fetch assigned users");
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
            result: { ...result, poDocument: fileStream !== "The specified key does not exist." ? fileStream : "" },
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
