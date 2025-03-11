// import logger
import logger from "./logger";

//  import functions
import { createCondition, properCase } from "./functions";

// import mysql class
import MySQL from "./mysql";

// get mysql instance
const mysql = new MySQL();

// export User class
export default class User{
  // set table name
  tableName: string;

  // on initiate
  constructor() {
    this.tableName = "user";
  }

  async save(data: any): Promise<any> {
    try {
        if (typeof data === "undefined") {
          throw new Error("Invalid or empty data!");
        }

        if (typeof data.id === "undefined") {
          const row: any = {
            userName: data.userName,
            fullName:data.fullName,
            // lastlogin: data.lastlogin,
            password: data.password
          };

          const user = await mysql.table(this.tableName);

          await mysql
            .into(this.tableName)
            .fields(Object.keys(row))
            .values(Object.values(row))
            .insert();

          return { message: "User created successfully.", status: "success" };
        } else {
          const row: any = {
            id: data.id,
            userName: data.userName,
            fullName:data.fullName,
            // lastlogin: data.lastlogin,
            password: data.password
          };

          const user = await mysql.table(this.tableName);

          const { exists: isUserExists } = await user.exists(row.id);

          if (isUserExists) {
            await mysql
              .table(this.tableName)
              .fields(Object.keys(row))
              .values(Object.values(row))
              .where(`id = '${row.id}'`)
              .update();

              return { message: "User updated successfully.", status: "success" };
            } else {
              return { message: "User not available with this id.", status: "success" };
          }
        }
      } catch (e: any) {
        console.log(e);
        
      // on error
      logger(`[error]: ${e.message}`);

      // response json data
      return { message: e.message, status: "error" };
    }
  }

  // 
  async get(id: string): Promise<any> {
    try {
      if (typeof id !== "undefined") {

        const user = await mysql.table(this.tableName);

        const { exists: isUserExists } = await user.exists(id);
        console.log(id, isUserExists);
        
        if (isUserExists) {
          const user = await mysql
            .table(this.tableName)
            .where(`id = '${id}'`);
          console.log(user);
            return { message: "User data received successfully.", status: "success" };
          } else {
            return { message: "User not available with this id.", status: "success" };
        }
      }
      }catch (err: any) {
      // on error
      console.error("Error fetching order:", err.message);

      // return data
      return { message: err.message, status: "error" };
    }
  }



  // async get(id: string): Promise<any> {
  //   try {
  //     if (!id) {
  //       throw new Error("Invalid ID!");
  //     }
  
  //     const user = await mysql
  // .table(this.tableName)
  // .select("fullName")
  // .where(`id = '${id}'`);
  
  //     if (user.length > 0) {
  //       return { 
  //         message: `User data received successfully: '${user[0].fullName}'.`, 
  //         fullName: user[0].fullName, 
  //         status: "success" 
  //       };
  //     } else {
  //       return { message: "User not available with this ID.", status: "error" };
  //     }
  //   } catch (err: any) {
  //     console.error("Error fetching user:", err.message);
  //     return { message: err.message, status: "error" };
  //   }
  // }
  
}