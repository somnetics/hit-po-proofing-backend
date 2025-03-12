// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import order class
import Issues from "../libs/issues";

// init fields class
const issues = new Issues();

// define save route
router.post("/save", async (req: Request, res: Response) => {
  // save order data
  const response = await issues.save(req.body);

  // return json response
  res.json(response);
});

// define update route
router.post("/update", async (req: Request, res: Response) => {
  // update order data
  const response = await issues.update(req.body);

  // return json response
  res.json(response);
});

// define get by id route
router.get("/search", async (req: Request, res: Response) => {
  try {
    // search forms
    const { results, total, message, status } = await issues.search(req.query);

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

// define suggestion route
router.get("/suggestion", async (req: Request, res: Response) => {
  // get field   
  const field = Object.keys(req.query)[0]?.toString();

  // get value 
  const value = Object.values(req.query)[0]?.toString();

  // getSuggestions
  const response = await issues.getSuggestions(field ?? "", value ?? "");
  
  // return json response
  res.json(response);
});

// define get by id route
router.get("/:id", async (req: Request, res: Response) => {
  // get response
  const response = await issues.get(req.params["id"] ?? "");

  // return response
  res.json(response);
});

// export route
export default router;
