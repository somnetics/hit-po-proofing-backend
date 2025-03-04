// // import logger
// import logger from "./logger";
// import axios from "axios";

// // import mysql class
// import MySQL from "./mysql";

// // get mysql instance
// const mysql = new MySQL();

// // define body type
// type DataType = {
//     orderNumber: string;
//     poDocument: string;
//     travelerDocument: string;
//     overlay: string;
//   }

// export default class ModelCall {
//   orderNumber: string;
//   poDocument: string;
//   travelerDocument: string;
//   overlay: string;
//     // on initiate
//   constructor() {
//     // set default values
//     this.orderNumber = "";
//     this.poDocument = "";
//     this.travelerDocument = "";
//     this.overlay = "";
//   }

//   async poDataValue(data: DataType): Promise<any> {
//     try {
//         // Forward the request body to 172.30.10.10:4000
//         const response = await axios.post("http://172.30.10.10:4000", req.body, {
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         });

//         // Send the response from the external API back to the client
//         res.json(response.data);
//     } catch (error) {
//         console.error("Error forwarding request:", error);
//     }
//   }
// }

import logger from "./logger";
import axios from "axios";
import MySQL from "./mysql";

const mysql = new MySQL();

type DataType = {
    orderNumber: string;
    poDocument: string;
    travelerDocument: string;
    overlay: string;
};

export default class ModelCall {
    orderNumber: string;
    poDocument: string;
    travelerDocument: string;
    overlay: string;

    constructor() {
        this.orderNumber = "";
        this.poDocument = "";
        this.travelerDocument = "";
        this.overlay = "";
    }

    async poDataValue(data: DataType): Promise<any> { 
        try {
            const response = await axios.post("http://172.30.10.10:4000", data, {
                headers: { "Content-Type": "application/json" },
            });

            return response.data; 
        } catch (error) {
            console.error("Error forwarding request:", error);
            throw new Error("Failed to process request"); 
        }
    }
}
