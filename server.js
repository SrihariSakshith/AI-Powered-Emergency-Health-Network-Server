import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import hospitalRoutes from "./HospitalsRoutes.js";
import loginRoutes from "./loginRoutes.js";
import donorFormRoutes from "./DonorFormRoutes.js";
import donorsRoutes from "./DonorsRoutes.js";
import contactRoutes from "./ContactRoutes.js";
import contactListRoutes from "./ContactListRoutes.js";
import hospitalProfileRoutes from "./HospitalProfileRoutes.js";
import patientProfileRoutes from "./PatientProfileRoutes.js";
import donorListRoutes from "./DonorListRoutes.js";
import chatRoutes from "./ChatRoutes.js";

dotenv.config();
const app = express();

// ✅ Enable CORS with frontend origin
import cors from "cors";

app.use(
  cors({
    origin: ["https://ai-powered-emergency-health-network-frontend.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.options("*", cors()); // Enable CORS for all preflight requests

// ✅ Middleware to Parse JSON Requests
app.use(express.json());

// ✅ Routes
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/login", loginRoutes);
app.use("/api/donor-form", donorFormRoutes);
app.use("/api/donorslist", donorListRoutes);
app.use("/api/donors", donorsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/contact-list", contactListRoutes);
app.use("/api/hospital-profile", hospitalProfileRoutes);
app.use("/api/patient-profile", patientProfileRoutes);
app.use("/api/donor-list", donorListRoutes);
app.use("/api/chat", chatRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// ✅ Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running!" });
});

// ✅ Test Connection Route
app.get("/api/test-connection", (req, res) => {
  res.status(200).json({ success: true, message: "Frontend & Backend are connected!" });
});

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 Unexpected Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ✅ Export Express app (No `app.listen`)
export default app;
