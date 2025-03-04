// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import order class
import Order from "../libs/order";

// init order class
const order = new Order();

// define search route
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
    res.json({ results: results, total: total, message: message, status: status });

  } catch (err: any) {
    // on error
    console.error(err.message);

    // response json data
    res.json({ results: [], total: 0, message: err.message, status: "error" });
  }
});

// export route
export default router;