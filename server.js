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

// Enable CORS (Configure this properly for production!)
app.use(cors({
  origin: 'https://ai-powered-emergency-health-network-frontend.vercel.app/', // Allow requests from the frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Include OPTIONS for preflight requests
  credentials: true, // Allow cookies and credentials
}));

// Middleware to parse JSON requests
app.use(express.json());

// Mount the routes
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

// Add missing routes for user location and blood group
app.get('/donors/api/user-location', (req, res) => {
  const { username, role } = req.query;
  if (username && role) {
    res.json({ location: 'Delhi, NCR' }); // Mock response
  } else {
    res.status(404).send('User location not found');
  }
});

app.get('/donors/api/user-blood-group', (req, res) => {
  const { username } = req.query;
  if (username) {
    res.json({ blood_group: 'AB+' }); // Mock response
  } else {
    res.status(404).send('Blood group not found');
  }
});

// Serve static files (React app) only after API routes
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(path.resolve(), "/build")));
    app.get("*", (req, res) => {
        if (!req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/hospitals')) {
            res.sendFile(path.resolve("build", "index.html"));
        } else {
            res.status(404).send("API route not found");
        }
    });
}

const PORT = process.env.PORT || 3001; // Change to 3000 to match client-side requests
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
