import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection URI
const mongoURI = process.env.MONGODB_URI;

// Ensure mongoose connects only once
if (mongoose.connection.readyState === 0) {
    mongoose.connect(mongoURI)
        .then(() => console.log('MongoDB connected successfully'))
        .catch(err => console.error('MongoDB connection error:', err));
}

// Define the schema outside the function
const contactSchema = new mongoose.Schema({
    username: String,
    description: String,
    createdAt: { type: Date, default: Date.now }
});

// Initialize model globally
const Contact = mongoose.models.Contact || mongoose.model('Contact', contactSchema);

// POST route to handle contact form submission
export const submitContactForm = async (req, res) => {
    const { username, description } = req.body;

    if (!username || !description) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        // Ensure `Contact` exists
        if (!Contact) {
            return res.status(500).json({ success: false, message: 'Database model not initialized' });
        }

        // Create a new contact document
        const newContact = new Contact({ username, description });

        // Save to MongoDB
        await newContact.save();

        res.status(200).json({ success: true, message: 'Query submitted successfully' });
    } catch (error) {
        console.error('Error saving contact data:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later' });
    }
};
