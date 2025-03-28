import express from "express";
import { handleLogin } from "./loginController.js";

const router = express.Router();

// ✅ Ensure the route is defined as `/login/login`
router.post("/login/login", handleLogin);

// Catch-all for undefined endpoints
router.use((req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

export default router;
