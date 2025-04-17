// import express
import express, { Request, Response } from "express";

// init express router
const router = express.Router();

// import issue class
import Issues from "../libs/issues";

// init issues class
const issues = new Issues();

// define save route
router.post("/save", async (req: Request, res: Response) => {
  // save issue data
  const response = await issues.save(req.body);

  // return json response
  res.json(response);
});

// define update route
router.post("/update", async (req: Request, res: Response) => {
  // update issue data
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

// Route to download issue data as an Excel file
router.get("/download", async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Call the download method from the issues service with query parameters
    const { buffer, fileName, status, message } = await issues.download(req.query);

    // 2. Log any informational message (e.g., "No data found")
    if (message) console.log("Message:", message);

    // 3. If an error occurred, respond with a 500 error and the message
    if (status === "error") {
      res.status(500).json({ message, status });
      return;
    }

    // 4. Set headers to prompt the browser to download the Excel file
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`); // Sets the downloaded file name
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ); // Sets correct MIME type for .xlsx files

    // 5. Send the Excel buffer as the file content
    res.end(buffer);
  } catch (err: any) {
    // 6. Handle any unexpected errors during the download process
    console.error("Download Error:", err.message);
    res.status(500).json({ message: err.message, status: "error" });
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

// fetch assignto and username
router.get("/assigned-users", async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await issues.getAssignedUsers();
    res.status(200).json({ status: "success", data });
  } catch (err: any) {
    console.error("Error fetching assigned users:", err.message);
    res.status(500).json({ status: "error", message: err.message });
  }
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
