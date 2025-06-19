// requrie mysql module
import {
  createPool,
  Pool,
  PoolConnection,
  QueryError,
  RowDataPacket,
  ResultSetHeader,
} from "mysql2";

// export mysql class
export default class MySQL {
  // define properties
  db: Pool;
  tableNames: string;
  fieldNames: string | string[];
  fieldValues: any[];
  condition: string;
  offsetValue: number | undefined;
  limitValue: number | undefined;
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
      connectionLimit: 100,
      queueLimit: 0,
      keepAliveInitialDelay: 10000, // 0 by default.
      enableKeepAlive: true, // false by default.
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
    return new Promise<{ results: any; query: string }>((resolve, reject) => {
      // get connection pool
      this.db.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          // if error
          if (err) {
            // reject with err
            reject(err);
          } else {
            // set query
            const query = `DESCRIBE ${this.tableNames}`;

            // prepare statement
            connection.query(
              query,
              async (err: QueryError | null, rows: RowDataPacket) => {
                // close the connection to pool
                connection.destroy();

                // if error
                if (err) {
                  // show query
                  console.log(query);

                  // reject with err
                  reject(err);
                } else {
                  resolve({
                    results: JSON.parse(JSON.stringify(rows)).map(
                      (row: any) => row
                    ),
                    query: query,
                  });
                }
              }
            );
          }
        }
      );
    });
  }

  // if exists
  exists(id: string) {
    // return promise
    return new Promise<{ exists: boolean; result: any }>((resolve, reject) => {
      // get connection pool
      this.db.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          // if error
          if (err) {
            // reject with err
            reject(err);
          } else {
            // set query
            const query = `SELECT * FROM ${this.tableNames} WHERE id = '${id}'`;

            // prepare statement
            connection.query(
              query,
              // (err: QueryError | null, rows: RowDataPacket) => {
              (err: QueryError | null, rows: any) => {
                // close the connection to pool
                connection.destroy();

                // if error
                if (err) {
                  // show query
                  console.log(query);

                  // reject with err
                  reject(err);
                } else {
                  // resolve with data
                  resolve({
                    exists: rows.length ? true : false,
                    result: rows.length ? rows[0] : [],
                  });
                }
              }
            );
          }
        }
      );
    });
  }

  // insert record
  insert() {
    // return promise
    return new Promise<{ result: ResultSetHeader; query: string }>(
      (resolve, reject) => {
        // get connection pool
        this.db.getConnection(
          (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
            // if error
            if (err) {
              // reject with err
              reject(err);
            } else {
              // set query
              const query =
                `INSERT INTO ${this.tableNames} (${this.fieldNames}) VALUES ('${this.fieldValues.join("', '")}')`.replace(
                  /'NULL'/g,
                  "NULL"
                );

              // prepare statement
              connection.query(
                query,
                (err: QueryError | null, result: ResultSetHeader) => {
                  // close the connection to pool
                  connection.destroy();

                  // if error
                  if (err) {
                    // show query
                    console.log(query);

                    // reject with err
                    reject(err);
                  } else {
                    // resolve with data
                    resolve({
                      result: result,
                      query: query,
                    });
                  }
                }
              );
            }
          }
        );
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
      (resolve, reject) => {
        // get connection pool
        this.db.getConnection(
          (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
            // if error
            if (err) {
              // reject with err
              reject(err);
            } else {
              // set query
              const query = `UPDATE ${this.tableNames} SET ${fliedValuePair.join(", ")} WHERE ${this.condition || 1}`;

              // prepare statement
              connection.query(
                query,
                (err: QueryError | null, result: ResultSetHeader) => {
                  // close the connection to pool
                  connection.destroy();

                  // if error
                  if (err) {
                    // show query
                    console.log(query);

                    // reject with err
                    reject(err);
                  } else {
                    // resolve with data
                    resolve({
                      result: result,
                      query: query,
                    });
                  }
                }
              );
            }
          }
        );
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
  offset(value?: number) {
    // set offset
    this.offsetValue = value;

    // return this instance
    return this;
  }

  // set limit
  limit(value?: number) {
    // set limit
    this.limitValue = value;

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
    return new Promise<number>((resolve, reject) => {
      // get connection pool
      this.db.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          // if error
          if (err) {
            // reject with err
            reject(err);
          } else {
            // set query
            const query = `SELECT COUNT(*) as cnt FROM ${this.tableNames} WHERE ${this.condition || 1}`;

            // prepare statement
            connection.query(
              query,
              (err: QueryError | null, rows: RowDataPacket) => {
                // close the connection to pool
                connection.destroy();

                // if error
                if (err) {
                  // show query
                  console.log(query);

                  // reject with err
                  reject(err);
                } else {
                  // resolve with data
                  resolve(Number(rows[0].cnt));
                }
              }
            );
          }
        }
      );
    });
  }

  // find one
  one() {
    // return promise
    return new Promise<{ total: number; result: any; query: string }>(
      (resolve, reject) => {
        // get connection pool
        this.db.getConnection(
          (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
            // if error
            if (err) {
              // reject with err
              reject(err);
            } else {
              // set query
              const query = `SELECT ${this.fieldNames ? this.fieldNames : "*"} FROM ${this.tableNames} WHERE ${this.condition || 1} ${this.key ? `ORDER BY ${this.key} ${this.order || ""}` : ""} LIMIT 1`;

              // prepare statement
              connection.query(
                query,
                (err: QueryError | null, rows: RowDataPacket) => {
                  // close the connection to pool
                  connection.destroy();

                  // if error
                  if (err) {
                    // show query
                    console.log(query);

                    // reject with err
                    reject(err);
                  } else {
                    // resolve with data
                    resolve({
                      total: Number(rows["length"]),
                      result: JSON.parse(JSON.stringify(rows[0] || {})),
                      query: query,
                    });
                  }
                }
              );
            }
          }
        );
      }
    );
  }

  // return array
  many() {
    // return promise
    return new Promise<{ total: number; results: any; query: string }>(
      (resolve, reject) => {
        // get connection pool
        this.db.getConnection(
          (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
            // if error
            if (err) {
              // reject with err
              reject(err);
            } else {
              // store condition
              const condition = this.condition;

              // let query
              let query = "";

              // on limit offset
              if (typeof this.offsetValue !== "undefined" && typeof this.limitValue !== "undefined") {
                // set query
                query = `SELECT ${this.fieldNames ? this.fieldNames : "*"} FROM ${this.tableNames} WHERE ${condition || 1} ${this.key ? `ORDER BY ${this.key} ${this.order || ""}` : ""} LIMIT ${this.limitValue} OFFSET ${(this.offsetValue - 1) * this.limitValue}`;
              } else {
                // set query
                query = `SELECT ${this.fieldNames ? this.fieldNames : "*"} FROM ${this.tableNames} WHERE ${condition || 1} ${this.key ? `ORDER BY ${this.key} ${this.order || ""}` : ""}`;
              }

              // prepare statement
              connection.query(
                query,
                async (err: QueryError | null, rows: RowDataPacket) => {
                  // close the connection to pool
                  connection.destroy();

                  // if error
                  if (err) {
                    // show query
                    console.log(query);

                    // reject with err
                    reject(err);
                  } else {
                    // get record count
                    const count: number = await this.table(this.tableNames)
                      .where(condition)
                      .count();

                    // resolve with data
                    resolve({
                      total: count,
                      results: JSON.parse(JSON.stringify(rows)).map(
                        (row: any) => row
                      ),
                      query: query,
                    });
                  }
                }
              );
            }
          }
        );
      }
    );
  }

  // delete record
  delete() {
    // return promise
    return new Promise<{ query: string }>((resolve, reject) => {
      // get connection pool
      this.db.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          // if error
          if (err) {
            // reject with err
            reject(err);
          } else {
            // set query
            const query = `DELETE FROM ${this.tableNames} WHERE ${this.condition || 1}`;

            // prepare statement
            connection.query(query, (err: QueryError | null) => {
              // close the connection to pool
              connection.destroy();

              // if error
              if (err) {
                // show query
                console.log(query);

                // reject with err
                reject(err);
              } else {
                // resolve with data
                resolve({ query: query });
              }
            });
          }
        }
      );
    });
  }

  // raw query
  raw(query: string) {
    // return promise
    return new Promise<{ total: number; results: any; query: string }>((resolve, reject) => {
      // get connection pool
      this.db.getConnection(
        (err: NodeJS.ErrnoException | null, connection: PoolConnection) => {
          // if error
          if (err) {
            // reject with err
            reject(err);
          } else {
            // prepare statement
            connection.query(
              query,
              async (err: QueryError | null, rows: RowDataPacket) => {
                // close the connection to pool
                connection.destroy();

                // if error
                if (err) {
                  // show query
                  console.log(query);

                  // reject with err
                  reject(err);
                } else {
                  resolve({
                    total: Number(JSON.parse(JSON.stringify(rows)).length),
                    results: JSON.parse(JSON.stringify(rows)).map(
                      (row: any) => row
                    ),
                    query: query,
                  });
                }
              }
            );
          }
        }
      );
    });
  }
}
