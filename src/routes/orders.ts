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

router.post("/checkbox-toggle-all", async (req: Request, res: Response) => {
  // checkboxToggleAll order data
  const response = await order.checkboxToggleAll(req.body);

  // return json response
  res.json(response);
});

router.post("/checkbox-modified-time", async (req: Request, res: Response) => {
  // checkboxToggleAll order data
  const response = await order.upsertOrder(req.body);

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

// Define a GET route for downloading Excel data
router.get("/download", async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Call the download function with the query parameters from the request
    const { buffer, fileName, status, message } = await order.download(req.query);

    // 2. Log message if any (e.g., "No data found")
    if (message) console.log("Message:", message);

    // 3. If download failed, send error response
    if (status === "error") {
      res.status(500).json({ message, status });
      return;
    }

    // 4. Set response headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`); // Suggests a file name to the client
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"); // MIME type for Excel file

    // 5. Send the Excel file buffer as the response
    res.end(buffer);
  } catch (err: any) {
    // 6. Catch and handle any unexpected errors
    console.error("Download Error:", err.message);
    res.status(500).json({ message: err.message, status: "error" });
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