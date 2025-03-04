// import mysql class
import MySQL from "@/libs/mysql";

// get mysql instance
const mysql = new MySQL();

// import required modules
import S3, { s3Options } from "@/libs/s3";

// s3 optionjs
const options: s3Options = {
  endPoint: process.env["S3_CLIENT_ENDPOINT"] as string || "",
  port: Number(process.env["S3_CLIENT_PORT"]) || 0,
  useSSL: Boolean(String(process.env["S3_CLIENT_USESSL"]).toLowerCase() === "true") || false,
  accessKey: process.env["S3_CLIENT_ACCESSKEY"] as string || "",
  secretKey: process.env["S3_CLIENT_SECRETKEY"] as string || "",
}

// create s3 instance
const s3 = new S3(options);

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  message: string;
  status: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  // id: orderNumber,
  // poDocument: poDocument,
  // travelerDocument: travelerDocument,
  // overlay: overlay,
  // checkBoxes: checkBoxes,
  // bizzRuleUrl: bizzRuleUrl,
  // userName: userName

  // check request
  if (req.method === "POST" && req.query.action === "insert") {
    try {
      // save the base64 image file stream to the bucket
      const bobImage = await s3.putFileStream(process.env["S3_BUCKET"] as string, req.body.poDocument, `${req.body.id}.png`);

      // save the html file stream to the bucket
      const bobHtml = await s3.putFileStream(process.env["S3_BUCKET"] as string, atob(req.body.travelerDocument), `${req.body.id}.html`);

      // if object
      if (typeof bobImage === "object" && typeof bobHtml === "object") {
        // get data
        const data: any = {
          id: req.body.id,
          overlay: req.body.overlay,
          checkboxes: req.body.checkBoxes,
          status: "OK"
        };

        // get orders
        const orders = await mysql.table("orders").exists(req.body.id);

        // if order exists and order_id present
        if (!orders.exists && data.id) {
          // update order
          await mysql
            .into("orders")
            .fields(Object.keys(data))
            .values(Object.values(data))
            .insert();
        } else {
          // create order    
          await mysql
            .table("orders")
            .fields(Object.keys(data))
            .values(Object.values(data))
            .where(`id = '${req.body.id}'`)
            .update();
        }

        // call api
        const re = await fetch(`${process.env.PYTHON_API_HOST}/validate`, {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: req.body.id,
            poDocument: req.body.poDocument,
            checkBoxes: req.body.checkBoxes,
            travelerDocument: req.body.travelerDocument
          })
        });

        // // get response data
        const data1 = await re.json();

        console.log(data1);

        // response json data
        res.json({ message: "Order updated successfully.", status: "success" });
      } else {
        // response json data
        res.json({ message: "Unable to store in s3", status: "error" });
      }
    } catch (e: any) {
      // response json data
      res.json({ message: e.message, status: "error" });
    }
  } else if (req.method === "GET" && req.query.action === "fetch" && typeof req.query.orderNumber !== "undefined") {
    try {
      // get file stream
      const bobImage = await s3.getFileStream(process.env["S3_BUCKET"] as string, `${req.query.orderNumber}.png`);

      // get order
      const { result, total } = await mysql
        .from("orders")
        .where(`id = '${req.query.orderNumber}'`)
        .one();

      // response json data
      res.json({ message: { ...result, poDocument: bobImage }, status: "success" });
    } catch (e: any) {
      // response json data
      res.json({ message: e.message, status: "error" });
    }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    }
  }
}