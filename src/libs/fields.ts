// import logger
import logger from "./logger";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

// export Fields class
export default class fields {
  // set table name
  tableName: string;

  // on initiate
  constructor() {
    this.tableName = "fields";
  }

  // passData data
  async save(data: any): Promise<any> {
    try {
      if (typeof data === "undefined") {
        throw new Error("Invalid or empty data");
      }

      // get row
      const row: any = {
        status: data.status,
        method: data.method,
        label: data.label,
        synonyms: JSON.stringify(data.synonyms)
      };

      // fetch the field details from the database
      const { result, total } = await mysql
        .table(this.tableName)
        .where(`label = '${data.label}'`)
        .one();

      // if fields not exists
      if (total == 0) {
        // create fields
        await mysql
          .into(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .insert();
      } else {
        // update fields
        await mysql
          .table(this.tableName)
          .fields(Object.keys(row))
          .values(Object.values(row))
          .where(`id = '${result.id}'`)
          .update();
      }

      // response json data
      return { message: "fields updated successfully.", status: "success" };
    } catch (e: any) {
      // on error
      logger(`[error]: ${e.message}`);

      // response json data
      return { message: e.message, status: "error" };
    }
  }

  // get data
  async get(label: string): Promise<any> {
    try {
      if (typeof label !== "undefined" && label.trim() !== "") {
        // fetch the field details from the database
        const { result, total } = await mysql
          .table(this.tableName)
          .where(`label = '${label}'`)
          .one();
        // return data
        return {
          result: result,
          total: total,
          status: "success"
        };
      } else {
        // return data
        return { message: "Fields not found", status: "error" };
      }
    } catch (err: any) {
      // on error
      console.error("Error fetching Fields:", err.message);

      // return data
      return { message: err.message, status: "error" };
    }
  }

  // get data
  async list(): Promise<any> {
    try {
      // fetch the field details from the database
      const { results, total } = await mysql
        .table(this.tableName)
        .select("*")
        .many();

      // return data
      return {
        results: results,
        total: total,        
        status: "success"
      };
    } catch (err: any) {
      // on error
      console.error("Error fetching Fields:", err.message);

      // return data
      return { message: err.message, status: "error" };
    }
  }
}