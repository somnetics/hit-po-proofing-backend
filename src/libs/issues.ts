// import logger
import logger from "./logger";

// import mysql class
import MySQL from "./mysql";

import * as ExcelJS from "exceljs";

// get mysql instance
const mysql = new MySQL();

//  import functions
import { createCondition, properCase } from "./functions";

// export issues class
export default class issues {
  // set table name
  tableName: string;
  // tableName2: string;
  // there is another table name as operator

  // on initiate
  constructor() {
    this.tableName = "issue";
    // this.tableName2 = "operator";
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
        // email: data.email || null,
        remarks: data.remarks || null,
        remarks_color: data.remarks_color || null
      };

      // Check if an issue with the same PO number exists
      const { result, total } = await mysql
        .table(this.tableName)
        .where(`soNumber = '${data.soNumber}'`)
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
        console.log(result.id);
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

  async update(data: any): Promise<any> {
    try {
      // Validate input
      if (!data) {
        throw new Error("Invalid input data");
      }

      // Prepare the row for update
      const row: any = {
        id: data.label || null,
        assignTo: data.assignTo || null,
        email: data.email || null,
        status: data.status || null,
        color: data.status_color || null,
        completed: data.completed ?? 0,
      };

      // Check if the issue exists
      const { result, total } = await mysql
        .table(this.tableName)
        .where(`id = '${data.label}'`)
        .one();

      if (total === 0) {
        return { message: "Issue not found", status: "error" };
      }

      // Update the issue
      await mysql
        .table(this.tableName)
        .fields(Object.keys(row))
        .values(Object.values(row))
        .where(`id = '${data.label}'`)
        .update();

      return { message: "Issue updated successfully", status: "success" };
    } catch (err: any) {
      logger(`[error]: ${err.message}`);
      return { message: err.message, status: "error" };
    }
  }

  // get data
  async get(id: string): Promise<any> {
    try {
      if (!id || id.trim() === "") {
        throw new Error("Invalid or empty id");
      }

      // Fetch the field details from the database
      const { result, total }: any = await mysql
        .table(this.tableName)
        .where(`id = '${id}'`)
        .one();

      // Ensure data exists
      if (total > 0) {
        return {
          result: result,
          total: total,
          status: "success"
        };
      } else {
        return { message: "Order not found", status: "error" };
      }
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

    const conditions: string[] =
      typeof options["assignTo"] !== "undefined"
        ? [`isu.assignTo LIKE '%${options["assignTo"]}%'`]
        : [];

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

  async getSuggestions(field: string, value: string): Promise<any> {
    try {
      // get json data
      const { results, total } = await mysql
        .table(this.tableName)
        .select(`distinct ${field}`)
        .where(`${field} LIKE '%${value}%'`)
        .offset(0)
        .limit(20)
        .sort(field, "asc")
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
      // Extract pagination and sorting parameters
      const offset = Number(options["page"]) || 1;
      const limit = Number(options["size"]) || 50;
      const order_by = (options["order_by"]?.toString() || "ord.id:asc").split(":");
      const struct = options["struct"]?.toString();
  
      // Remove used keys to prevent them from affecting condition generation
      delete options["page"];
      delete options["size"];
      delete options["order_by"];
      delete options["trash"];
      delete options["struct"];
  
      // Build SQL WHERE conditions
      const conditions: string[] =
        typeof options["assignTo"] !== "undefined"
          ? [`isu.assignTo LIKE '%${options["assignTo"]}%'`]
          : [];
  
      // Generate dynamic condition if struct is provided
      if (typeof struct !== "undefined") {
        createCondition(conditions, options, struct);
      }
  
      // Define allowed columns to be selected
      const allowedKeys = [
        "id",
        "assignTo",
        "poNumber",
        "soNumber",
        "userName",
        "problemDetails",
        "problemOccourIn",
        "dateOfProblem",
        "shipDate",
        "remarks",
        "email",
        "status"
      ];
  
      // Fetch filtered results from database
      const { results, total } = await mysql
        .select(allowedKeys.map((key) => `isu.${key}`))
        .from(`${this.tableName} isu`)
        .where(conditions.join(" AND "))
        .offset(offset)
        .limit(limit)
        .sort(order_by[0] as string, order_by[1] as string)
        .many();
  
      // Initialize Excel workbook and sheet
      const ExcelJS = require("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Issues");
  
      // If no results found, return early
      if (!results || results.length === 0) {
        return {
          message: "No data found",
          status: "no_data",
          total: 0,
          results: []
        };
      }
  
      // Define headers for Excel sheet
      const headerMap: Record<string, string> = {
        id: "Id",
        assignTo: "Assign To",
        poNumber: "Po Number",
        soNumber: "So Number",
        userName: "User Name",
        problemDetails: "Problem Details",
        problemOccourIn: "Problem Occour In",
        dateOfProblem: "Date Of Problem",
        shipDate: "Ship Date",
        remarks: "Remarks",
        email: "Email",
        status: "Status"
      };
  
      // Set up worksheet columns using allowed keys and headers
      worksheet.columns = allowedKeys.map((key) => ({
        header: headerMap[key] || key,
        key: key,
        width: 20
      }));
  
      // Populate worksheet rows and apply coloring
      results.forEach((row: any) => {
        const excelRow = worksheet.addRow(row);
  
        const rowColor = (row.color || "").toLowerCase();
        const remarksColor = (row.remarks_color || "").toLowerCase();
  
        // Helper function to fill the entire row with color
        const fullRowFill = (argbColor: string) => {
          excelRow.eachCell((cell: any) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: argbColor }
            };
            cell.font = { bold: true, color: { argb: "FF000000" } };
          });
        };
  
        // Apply color based on row.color
        if (rowColor === "green" || row.completed === 1) {
          fullRowFill("FF00FF00"); // Light green
        } else if (rowColor === "blue") {
          fullRowFill("FF7DF9FF"); // Light blue
        } else if (rowColor === "yellow") {
          // Only color 'status' and 'email' 
          ["status", "email"].forEach((key) => {
            const colIndex = worksheet.columns.findIndex(
              (col: ExcelJS.Column) => col.key === key
            );
            if (colIndex !== -1) {
              const cell = excelRow.getCell(colIndex + 1);
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFFF00" }
              };
              cell.font = { bold: true, color: { argb: "FF000000" } };
            }
          });
        }
  
        // Apply coloring for remarks based on remarks_color
        if (remarksColor === "red" || remarksColor === "blue") {
          const colorMap: Record<string, string> = {
            red: "FFFF0000",
            blue: "FF0D6EFD"
          };
          const colIndex = worksheet.columns.findIndex(
            (col: ExcelJS.Column) => col.key === "remarks"
          );
          if (colIndex !== -1) {
            const cell = excelRow.getCell(colIndex + 1);
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: colorMap[remarksColor] }
            };
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
          }
        }
      });
  
      // Generate Excel buffer for download
      const buffer = await workbook.xlsx.writeBuffer();
  
      return {
        buffer,
        fileName: `issues_${Date.now()}.xlsx`,
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
}
