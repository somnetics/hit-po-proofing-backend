// requrie mysql module
import {
  createPool,
  Pool,
  PoolConnection,
  QueryError,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2";

import mysql, { Connection } from 'mysql2/promise';

// export mysql class
export default class MySQL {
  // define properties
  db: Pool;
  conn!: Connection;
  tableNames: string;
  fieldNames: string | string[];
  fieldValues: any[];
  condition: string;
  offsetValue: number;
  limitValue: number;
  key: string;
  order: string;

  // class constructor
  constructor() {
    // get mysql connection
    this.db = createPool({
      host: process.env["MYSQL_HOST"] as string,
      port: Number(process.env["MYSQL_PORT"]),
      user: process.env["MYSQL_USER"] as string,
      password: process.env["MYSQL_PASS"] as string,
      database: process.env["MYSQL_DB"] as string,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // set default table names
    this.tableNames = "";

    // set default field names
    this.fieldNames = "*";

    // set default field values
    this.fieldValues = [];

    // set default condition
    this.condition = "1";

    // set default offset
    this.offsetValue = 1;

    // set default limit
    this.limitValue = 50;

    // set default key
    this.key = "";

    // set default order
    this.order = "";

    // connect to database
    this.connect();
  }

  async connect() {
    this.conn = await mysql.createConnection({
      host: process.env["MYSQL_HOST"] as string,
      port: Number(process.env["MYSQL_PORT"]),
      user: process.env["MYSQL_USER"] as string,
      password: process.env["MYSQL_PASS"] as string,
      database: process.env["MYSQL_DB"] as string,
    });
  }

  // init properties
  init() {
    // set default table names
    this.tableNames = "";

    // set default field names
    this.fieldNames = "*";

    // set default field values
    this.fieldValues = [];

    // set default condition
    this.condition = "1";

    // set default offset
    this.offsetValue = 1;

    // set default limit
    this.limitValue = 50;

    // set default key
    this.key = "";

    // set default order
    this.order = "";
  }

  // return random key
  randomKey() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

  // return unique id
  uuid() {
    // return uuid
    return `${this.randomKey()}${this.randomKey()}-${this.randomKey()}-${this.randomKey()}-${this.randomKey()}-${this.randomKey()}${this.randomKey()}${this.randomKey()}`;
  }

  // describe table
  describe() {
    // return promise
    return new Promise<{ results: any; query: string }>(
      async (resolve, reject) => {
        try {
          // set query
          const query = `DESCRIBE ${this.tableNames}`;

          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve({
            results: rows,
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // if exists
  exists(id: string) {
    // return promise
    return new Promise<{ exists: boolean; result: any }>(
      async (resolve, reject) => {
        try {
          // set query
          const query = `SELECT * FROM ${this.tableNames} WHERE id = '${id}'`;

          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve({
            exists: rows.length ? true : false,
            result: rows.length ? rows[0] : [],
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // insert record
  insert() {
    // return promise
    return new Promise<{ result: ResultSetHeader; query: string }>(
      async (resolve, reject) => {
        try {
          // set query
          const query =
            `INSERT INTO ${this.tableNames} (${this.fieldNames}) VALUES ('${this.fieldValues.join("', '")}')`.replace(
              /'NULL'/g,
              "NULL"
            );

          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve({
            result: rows,
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // update record
  update() {
    // initiate field value pair
    const fliedValuePair: string[] = [];

    // get fields
    this.fieldNames = Array.isArray(this.fieldNames)
      ? this.fieldNames
      : this.fieldNames.split(",");

    // field value pair for each field
    this.fieldNames.forEach((fieldName, indx) => {
      // creating field value pair
      fliedValuePair.push(
        `${fieldName.trim()} = ${typeof this.fieldValues[indx] == "string" ? `'${this.fieldValues[indx]?.trim()}'`.replace(/'NULL'/g, "NULL") : this.fieldValues[indx]}`
      );
    });

    // return promise
    return new Promise<{ result: ResultSetHeader; query: string }>(
      async (resolve, reject) => {
        try {
          // set query
          const query = `UPDATE ${this.tableNames} SET ${fliedValuePair.join(", ")} WHERE ${this.condition || 1}`;
          // get rows
          const [rows]: any = await this.conn.query(query);
          // resolve with data
          resolve({
            result: rows,
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // select
  select(fields: string | string[]) {
    // get fields
    this.fieldNames = Array.isArray(fields) ? fields.join(", ") : fields;

    // return this instance
    return this;
  }

  // from
  from(tables: string | string[]) {
    // init properties
    this.init();

    // get table
    this.tableNames = Array.isArray(tables) ? tables.join(", ") : tables;

    // return this instance
    return this;
  }

  // into
  into(table: string) {
    // return this instance
    return this.from(table);
  }

  // fields
  table(table: string) {
    // return this instance
    return this.from(table);
  }

  // fields
  fields(fields: string | string[]) {
    // return this instance
    return this.select(fields);
  }

  // select
  values(fieldValues: any | any[]) {
    // get fields
    this.fieldValues = Array.isArray(fieldValues)
      ? fieldValues
      : fieldValues.split(",");

    // return this instance
    return this;
  }

  // where
  where(condition: string) {
    // get condition
    this.condition = condition || this.condition;

    // return this instance
    return this;
  }

  // set offset
  offset(value: number) {
    // set offset
    this.offsetValue = value || this.offsetValue;

    // return this instance
    return this;
  }

  // set limit
  limit(value: number) {
    // set limit
    this.limitValue = value || this.limitValue;

    // return this instance
    return this;
  }

  // sort data
  sort(key: string, order: string) {
    // if oder is defiend
    if (typeof order !== "undefined") {
      // set key
      this.key = key || this.key;

      // set order
      this.order = order || this.order;
    } else {
      // set key field
      this.key = key;
    }

    // return this instance
    return this;
  }

  // count
  count() {
    // return promise
    return new Promise<number>(
      async (resolve, reject) => {
        try {
          // set query
          const query = `SELECT COUNT(*) as cnt FROM ${this.tableNames} WHERE ${this.condition || 1}`;

          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve(rows[0].cnt);
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // find one
  one() {
    // return promise
    return new Promise<{ total: number; result: any; query: string }>(
      async (resolve, reject) => {
        try {
          // store condition
          const condition = this.condition;

          // set query
          const query = `SELECT ${this.fieldNames ? this.fieldNames : "*"} FROM ${this.tableNames} WHERE ${condition || 1} ${this.key ? `ORDER BY ${this.key} ${this.order || ""}` : ""} LIMIT ${this.limitValue} OFFSET ${(this.offsetValue - 1) * this.limitValue}`;

          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve({
            total: rows.length,
            result: rows.length > 0 ? rows[0] : {},
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // return array
  many() {
    // return promise
    return new Promise<{ total: number; results: any; query: string }>(
      async (resolve, reject) => {
        try {
          // store condition
          const condition = this.condition;

          // set query
          const query = `SELECT ${this.fieldNames ? this.fieldNames : "*"} FROM ${this.tableNames} WHERE ${condition || 1} ${this.key ? `ORDER BY ${this.key} ${this.order || ""}` : ""} LIMIT ${this.limitValue} OFFSET ${(this.offsetValue - 1) * this.limitValue}`;

          // get rows
          const [rows]: any = await this.conn.query(query);

          // get record count
          const count = await this.table(this.tableNames)
            .where(condition)
            .count();

          // resolve with data
          resolve({
            total: count,
            results: rows,
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // delete record
  delete() {
    // return promise
    return new Promise<{ query: string }>(
      async (resolve, reject) => {
        try {
          // set query
          const query = `DELETE FROM ${this.tableNames} WHERE ${this.condition || 1}`;

          // get rows
          await this.conn.query(query);

          // resolve with data
          resolve({
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }

  // raw query
  raw(query: string) {
    // return promise
    return new Promise<{ total: number; results: any; query: string }>(
      async (resolve, reject) => {
        try {
          // get rows
          const [rows]: any = await this.conn.query(query);

          // resolve with data
          resolve({            
            total: rows.length,
            results: rows,
            query: query,
          });
        } catch (e) {
          // reject with err
          reject(e);
        }
      }
    );
  }
}
