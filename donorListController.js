import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let donorsCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url); // Removed deprecated options
    db = client.db(dbName);
    donorsCollection = db.collection('Donors');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectToDatabase();

// Fetch donors data
export const getDonors = async (req, res) => {
  try {
    const donors = await donorsCollection.find().toArray();

    // Validate and format donor data
    const donorData = donors.map((donor) => ({
      username: donor.username || 'Unknown', // Default value if username is missing
      donation: donor.donation || 'Not Available', // Default value if donation is missing
      email: donor.email || 'Not Available', // Default value if email is missing
      location: donor.location || 'Not Available', // Default value if location is missing
    }));

    res.json(donorData);
  } catch (error) {
    console.error('Error fetching donors:', error);
    return res.status(500).json({ message: 'Error fetching donors data' });
  }
};

// Delete a donor by username
export const deleteDonor = async (req, res) => {
  try {
    const donorUsername = req.params.username;
    console.log(`Deleting donor with username: ${donorUsername}`);

    const result = await donorsCollection.deleteOne({ username: donorUsername });

    if (result.deletedCount === 1) {
      res.status(200).json({ message: 'Donor deleted successfully' });
    } else {
      res.status(404).json({ message: 'Donor not found' });
    }
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// Add a new donor
export const addDonor = async (req, res) => {
  try {
    const { username, donation, email, location } = req.body;

    if (!username || !email || !location) {
      return res.status(400).json({ message: 'Username, email, and location are required' });
    }

    const donor = {
      username,
      donation: donation || 'Not Available',
      email,
      location,
    };

    await donorsCollection.insertOne(donor);

    res.status(201).json({ message: 'Donor added successfully' });
  } catch (error) {
    console.error('Error adding donor:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};