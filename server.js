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
const allowedOrigins = [
  "https://ai-powered-emergency-health-network-frontend.vercel.app",
  "https://ai-powered-emergency-health-network-frontend-joxlhqvr4.vercel.app"
];

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
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
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

// Default route to confirm the server is running
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running!' });
});

// Handle requests for favicon.ico to avoid 404 errors
app.get('/favicon.ico', (req, res) => {
  res.status(204).send(); // No Content
});

// Serve static files (React app) only in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(path.resolve(), "/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve("build", "index.html"));
  });
}

// Global error handler for unexpected errors
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Export the app object for testing or external use
export default app;
