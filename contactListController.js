import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let contactsCollection;

// Function to connect to the database
async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url); // Removed deprecated options
    db = client.db(dbName);
    contactsCollection = db.collection('contacts');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);  // Exit the process if DB connection fails
  }
}

connectToDatabase();

// Fetch contacts data
export const getContacts = async (req, res) => {
  try {
    // Fetch all contacts from the 'contacts' collection
    const contacts = await contactsCollection.find().toArray();

    // Extract relevant fields: username, description, createdAt
    const contactData = contacts.map(contact => ({
      username: contact.username,
      description: contact.description || 'No description available',  // Default description if missing
      createdAt: contact.createdAt || 'Not Available'  // Default createdAt if missing
    }));

    res.json(contactData);  // Send the filtered data as JSON response
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({ message: 'Error fetching contacts data' });
  }
};