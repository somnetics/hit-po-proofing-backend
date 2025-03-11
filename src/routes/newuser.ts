import express, { Request, Response } from "express";

// init express router
const router = express.Router();

import User from "../libs/user";

// init User class
const user = new User();

//define save route
router.post("/save", async (req: Request, res: Response) => {
  // save user data
  const response = await user.save(req.body);

  // return json response
  res.json(response);
});

// define get by id route
router.get("/:id", async (req: Request, res: Response) => {
  // let response
  let response = {};

  // get response
  response = await user.get(req.params["id"] ?? "");

  // return response
  res.json(response);
});

// export route
export default router;
