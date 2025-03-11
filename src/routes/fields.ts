// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import order class
import Fields from "../libs/fields";

// init fields class
const fields = new Fields();

// define save route
router.post("/save", async (req: Request, res: Response) => {
  // save order data
  const response = await fields.save(req.body);

  // return json response
  res.json(response);
});

// define get by id route
router.get("/list", async (req: Request, res: Response) => {
  // let response
  let response = {};

  // get response
  response = await fields.list();

  // return response
  res.json(response);
});

// define get by id route
router.get("/:label", async (req: Request, res: Response) => {
  // let response
  let response = {};

  // get response
  response = await fields.get(req.params["label"] ?? "");

  // return response
  res.json(response);
});

// export route
export default router;