import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let donorsCollection;

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
      db = client.db(dbName);
      donorsCollection = db.collection('Donors');
      console.log(`✅ Connected to MongoDB database: ${dbName}`);
      return;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error);
      retries -= 1;
      console.log(`Retrying MongoDB connection (${retries} retries left)...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  console.error('❌ Failed to connect to MongoDB after multiple retries.');
  process.exit(1); // Exit if all retries fail
}

connectToDatabase();

// Fetch all donors
export const getAllDonors = async (req, res) => {
  try {
    const donors = await donorsCollection.find({}).toArray();

    if (!Array.isArray(donors)) {
      return res.status(500).json({ success: false, message: 'Invalid data format from database' });
    }

    const donorData = donors.map(donor => ({
      username: donor.username || 'Unknown',
      donation: donor.donation || 'Not Available',
      email: donor.email || 'Not Available',
      location: donor.location || 'Not Available',
    }));

    res.json({ success: true, data: donorData });
  } catch (error) {
    console.error('Error fetching donors:', error);
    res.status(500).json({ success: false, message: 'Error fetching donors data' });
  }
};

// Add a new donor
export const addDonor = async (req, res) => {
  try {
    const { username, donation, email, location } = req.body;

    if (!username || !email || !location) {
      return res.status(400).json({ success: false, message: 'Username, email, and location are required' });
    }

    const donor = {
      username,
      donation: donation || 'Not Available',
      email,
      location,
    };

    await donorsCollection.insertOne(donor);

    res.status(201).json({ success: true, message: 'Donor added successfully' });
  } catch (error) {
    console.error('Error adding donor:', error);
    res.status(500).json({ success: false, message: 'Error adding donor' });
  }
};

// Delete a donor by username
export const deleteDonor = async (req, res) => {
  try {
    const { username } = req.params;
    console.log('Deleting donor:', username);
    const result = await donorsCollection.deleteOne({ username });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    console.error('Error deleting donor:', error);
    res.status(500).json({ success: false, message: 'Error deleting donor' });
  }
};