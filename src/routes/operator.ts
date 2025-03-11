import express, { Request, Response } from "express";

// init express router
const router = express.Router();

import Operator from "../libs/operator";

// init operator class
const operator = new Operator();

//define save route
router.post("/save", async (req: Request, res: Response) => {
  // save operator data
  const response = await operator.save(req.body);

  // return json response
  res.json(response);
});

// define get by id route
router.get("/search", async (req: Request, res: Response) => {
  try {
    // search forms
    const { results, total, message, status } = await operator.search(req.query);

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


// export route
export default router;
