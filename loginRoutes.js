import express from "express";
import { handleLogin } from "./loginController.js";

const router = express.Router();

// Correct the route to `/login/login` to match the frontend request
router.post("/login/login", handleLogin);

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

export default router;
