// import function
import { createCondition } from "./functions";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

// export user class
export default class User {
  // define tablename
  tableName: string;
  
  // class constructor
  constructor() {
    // set tablename
    this.tableName = "user";
  }

  /**
   * get all saved users
   * @param {any} options search options
   */
  async getUsers(options: any) {
    // get offset
    const offset = Number(options["page"]) || 1;

    // get limit
    const limit = Number(options["size"]) || 50;

    // get order_by
    const order_by = (options["order_by"]?.toString() || "name:asc").split(":");

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
    const conditions: string[] = [`usr.deleted = ${trash == "true" ? 1 : 0}`, 'usr.is_super_user = 0'];

    try {
      // if struct is defined
      if (typeof struct !== "undefined") {
        // get conditions
        createCondition(conditions, options, struct);
      } else {
        // loop fields value
        for (const [key, value] of Object.entries(options)) {
          // add field condition
          conditions.push(`${key} = '${value}'`);
        }
      }

      // get json data
      const { results, total } = await mysql
        .table("user usr LEFT JOIN role rol ON rol.id = usr.role")
        .select("usr.*, rol.rolename")
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

  /**
   * get the user info for given user id
   * @param {string} id of the user to be searched
   */
  async getUserById(id: String) {
    try {
      // if id is supplied
      if (typeof id !== "undefined") {
        // get user
        const { result, total } = await mysql
          .from(this.tableName)
          .where(`id = '${id}'`)
          .one();

        // check user exists
        if (total) {
          // return results
          return { result: result, total: total, status: "success" };
        } else {
          // return results
          return { result: "User does not exists", total: 0, status: "error" };
        }
      } else {
        // set response
        return { result: "User Id cannot be empty", total: 0, status: "error" };
      }
    } catch (err: any) {
      // on error
      console.error(err.message);

      // response json data
      return { result: err.message, total: 0, status: "error" };
    }
  }

  /**
   * check existance of a user by mysql query
   * @param {string} query query of the user
   */
  async userExistsByQuery(query: String) {
    try {
      // get Service 
      const { result, total } = await mysql
        .from(this.tableName)
        .where(query as string)
        .one();

      // return results
      return { result: result, exists: total ? true : false, status: "success" }
    } catch (err: any) {
      // on error
      console.error(err.message);

      // return results
      return { result: err.message, status: "error" };
    }
  }

  /**
   * check suggestion of a user by mysql query
   * @param {string} fullname search query
   */
  async getUserSuggestion(fullname: string) {
    try {
      // get json data
      const { results, total, query } = await mysql
        .table(this.tableName)
        .select("id, fullname, email")
        .where(`(fullname LIKE '%${fullname}%' OR email LIKE '%${fullname}%') AND deleted = 0`)
        .offset(0)
        .limit(10)
        .sort("fullname asc,", "email asc")
        .many();

      // return results
      return { results: results, total: total }
    } catch (err: any) {
      // on error
      console.error(err.message);

      // response json data
      return { results: [], total: 0 };
    }
  }
}