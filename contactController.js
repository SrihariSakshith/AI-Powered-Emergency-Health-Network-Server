import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// Database Connection and Schema Definition (Important: Connect only once!)
let Contact; // Define Contact outside the function to avoid multiple definitions

async function connectToDatabase() {
    try {
        // Check if mongoose is already connected
        if (mongoose.connection.readyState === 0) { // Not connected
            await mongoose.connect(mongoURI); // Removed deprecated options
            console.log('MongoDB connected successfully');

            // Define the Contact model (only if mongoose is newly connected)
            const contactSchema = new mongoose.Schema({
                username: String,
                description: String,
                createdAt: { type: Date, default: Date.now }
            });

            Contact = mongoose.model('Contact', contactSchema);  // Assign Contact model after connection
        } else {
            console.log('MongoDB already connected');
        }
    } catch (err) {
        console.log('MongoDB connection error:', err);
        process.exit(1); // Exit the process if the database connection fails
    }
}

connectToDatabase(); // Initialize the database connection

// POST route to handle contact form submission
export const submitContactForm = async (req, res) => {
    const { username, description } = req.body;

    if (!username || !description) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Create a new contact document
        const newContact = new Contact({
            username,
            description
        });

        // Save to MongoDB
        await newContact.save();

        res.status(200).json({ success: true, message: 'Query submitted successfully' });
    } catch (error) {
        console.error('Error saving contact data:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later' });
    }
};