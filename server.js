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

// ✅ Allowed Frontend Origins
const allowedOrigins = [
  "https://ai-powered-emergency-health-network-frontend.vercel.app",
  "https://ai-powered-emergency-health-network-frontend-joxlhqvr4.vercel.app",
  "https://ai-powered-emergency-health-network-frontend-emseamfrm.vercel.app"
];

// ✅ Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`🚨 CORS Blocked: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials
  })
);

// ✅ Middleware for Preflight Requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ✅ Middleware to Parse JSON Requests
app.use(express.json());

// ✅ Routes
app.use("/hospitals", hospitalRoutes);
app.use("/login", loginRoutes); // Ensure the login routes are mounted correctly
app.use("/donor-form", donorFormRoutes);
app.use("/donors", donorsRoutes);
app.use("/contact", contactRoutes);
app.use("/contact-list", contactListRoutes);
app.use("/hospital-profile", hospitalProfileRoutes);
app.use("/patient-profile", patientProfileRoutes);
app.use("/donor-list", donorListRoutes);
app.use("/chat", chatRoutes);

// ✅ Default Route
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// ✅ Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running!' });
});

// ✅ Handle requests for favicon.ico
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No Content
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

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// ✅ Export App for Testing
export default app;
