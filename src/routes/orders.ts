// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import order class
import Order from "../libs/order";

// init order class
const order = new Order();

// define save route
router.post("/save", async (req: Request, res: Response) => {
  // save order data
  const response = await order.save(req.body);

  // return json response
  res.json(response);
});

// define search route
router.get("/search", async (req: Request, res: Response) => {
  try {
    // search forms
    const { results, total, message, status } = await order.search(req.query);

    // response json data
    res.json({
      results: results,
      total: total,
      message: message,
      status: status
    });
  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ results: [], total: 0, message: err.message, status: "error" });
  }
});

type ResultBody = {
  [key: string]: unknown;
}

type RespResult = {
  result: ResultBody;
  total: number;
  status: string;
}

// define get by id route
router.get("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {} as RespResult;

  // get response
  response = await order.get(req.params["id"] ?? "");

  // check if format is passed
  if (typeof req.query !== "undefined" && typeof req.query['format'] !== "undefined" && req.query['format'] == "extracted") {
    // get data
    const { checkList, poDocument }: any = response.result;

    // return response
    res.json({
      document: poDocument,
      fields: checkList.map((list: any) => ({ label: list.label, value: list.value ?? "" }))
    });
  } else {
    // return response
    res.json(response);
  }
});

// export route
export default router;