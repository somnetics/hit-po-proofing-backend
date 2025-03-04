// Import express
import express, { Request, Response } from "express";

// Initialize express router
const router = express.Router();

// Import order class
import ModelCall from "../libs/model_call";

// Initialize order class
const modelCall = new ModelCall();

// Define search route
router.post("/poDataValue", async (req: Request, res: Response) => {
    const { order_id, poDocument, travelerDocument } = req.body;

    console.log(`Processing request for order_id: ${req.body}`);

    // Fetching PO files from the service
    const response = a;
    console.log(response);
});

// Export route
export default router;
