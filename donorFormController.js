import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string from environment variables
const mongoURI = process.env.MONGODB_URI;

// Database Connection and Schema Definition (Connect only once!)
let Patient;  // Define Patient outside to avoid multiple definitions
let Hospital; // Define Hospital outside to avoid multiple definitions

async function connectToDatabase() {
    try {
        // Check if mongoose is already connected
        if (mongoose.connection.readyState === 0) { // Not connected
            await mongoose.connect(mongoURI); // Removed deprecated options
            console.log('Connected to MongoDB');

            // Define Mongoose schema for Patients and Hospitals
            const patientSchema = new mongoose.Schema({
                username: { type: String, required: true, unique: true },
                donation: { type: String, required: true },
            }, { collection: 'Patients' });

            const hospitalSchema = new mongoose.Schema({
                username: { type: String, required: true, unique: true },
                donation: { type: String, required: true },
            }, { collection: 'Hospitals' });

            // Create Mongoose models
            Patient = mongoose.model('Patient', patientSchema);
            Hospital = mongoose.model('Hospital', hospitalSchema);

        } else {
            console.log('MongoDB already connected');
        }
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

connectToDatabase();

// POST endpoint for submitting donor data
export const submitDonorData = async (req, res) => {
    const { username, donation, role } = req.body;

    try {
        if (role === 'patient') {
            // Update or add donation for patient
            const patient = await Patient.findOneAndUpdate(
                { username },
                { $set: { donation } },
                { new: true, upsert: true }
            );

            return res.json({ success: true, data: patient });
        } else if (role === 'hospital') {
            // Update or add donation for hospital
            const hospital = await Hospital.findOneAndUpdate(
                { username },
                { $set: { donation } },
                { new: true, upsert: true }
            );

            return res.json({ success: true, data: hospital });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }
    } catch (error) {
        console.error("Error saving donor data:", error);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
};