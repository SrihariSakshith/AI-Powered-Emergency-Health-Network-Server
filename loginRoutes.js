import express from "express";
import { handleLogin } from "./loginController.js";

const router = express.Router();

// Correcting the route to `/login`
router.post("/login", handleLogin);

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

export default router;
