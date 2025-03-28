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
app.use(
  cors({
    origin: "https://ai-powered-emergency-health-network-frontend.vercel.app",
    methods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// ✅ Middleware to Parse JSON Requests
app.use(express.json());

// ✅ Routes
app.use("/hospitals", hospitalRoutes);
app.use("/login", loginRoutes);
app.use("/donor-form", donorFormRoutes);
app.use("/donorslist", donorListRoutes);
app.use("/donors", donorsRoutes);
app.use("/contact", contactRoutes);
app.use("/contact-list", contactListRoutes);
app.use("/hospital-profile", hospitalProfileRoutes);
app.use("/patient-profile", patientProfileRoutes);
app.use("/donor-list", donorListRoutes);
app.use("/chat", chatRoutes);

// ✅ Default Route
app.get("/", (req, res) => {
  res.send("🚀 Server is running!");
});

// ✅ Health Check Route
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running!" });
});

// ✅ Test Connection Route
app.get("/test-connection", (req, res) => {
  res.status(200).json({ success: true, message: "Frontend & Backend are connected!" });
});

// ✅ Handle requests for favicon.ico
app.get("/favicon.ico", (req, res) => {
  res.status(204).send();
});

// ✅ Serve Static Files (Production Mode)
if (process.env.NODE_ENV === "production") {
  const buildPath = path.resolve("build");
  app.use(express.static(buildPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

// ✅ Global Error Handler
app.use((err, req, res, next) => {
  console.error("🚨 Unexpected Error:", err);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// ✅ Export App for Vercel
export default app;
