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

// Enable CORS properly
const allowedOrigins = ["https://ai-powered-emergency-health-network-frontend.vercel.app"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Middleware for preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || allowedOrigins[0]);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Middleware to parse JSON requests
app.use(express.json());

// Routes
app.use("/hospitals", hospitalRoutes);
app.use("/login", loginRoutes);
app.use("/donor-form", donorFormRoutes);
app.use("/donors", donorsRoutes);
app.use("/contact", contactRoutes);
app.use("/contact-list", contactListRoutes);
app.use("/hospital-profile", hospitalProfileRoutes);
app.use("/patient-profile", patientProfileRoutes);
app.use("/donor-list", donorListRoutes);
app.use("/chat", chatRoutes);

// Serve static files (React app) only in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(path.resolve(), "/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("build", "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
