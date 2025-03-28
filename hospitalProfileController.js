import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let hospitalCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    hospitalCollection = db.collection('Hospitals');
    console.log(`✅ Connected to MongoDB database: ${dbName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

connectToDatabase();

// Fetch hospital data by username
export const getHospital = async (req, res) => {
  try {
    const { username } = req.params;
    const hospital = await hospitalCollection.findOne({ username });

    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Log the donation status (if any)
    if (hospital.donation && hospital.donation.trim() !== '') {
      console.log(`Donation present for ${username}: ${hospital.donation}`);
    } else {
      console.log(`No donation present for ${username}`);
    }

    res.json(hospital);
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({ message: 'Error fetching hospital data' });
  }
};

// Update hospital profile
export const updateHospital = async (req, res) => {
  try {
    const { username } = req.params;
    const updatedData = req.body;

    // Only set the donation field if it is part of the update data
    if (!updatedData.hasOwnProperty('donation')) {
      // Get the current hospital data to preserve the donation field if not updated
      const currentHospital = await hospitalCollection.findOne({ username });

      if (currentHospital && currentHospital.donation) {
        // Preserve the donation field if not included in the update
        updatedData.donation = currentHospital.donation;
      }
    }

    // Update hospital data in the database
    const result = await hospitalCollection.updateOne(
      { username },
      { $set: updatedData }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Hospital not found or no changes made' });
    }

    console.log(`Hospital profile updated for ${username}`);
    res.json({ message: 'Hospital profile updated successfully' });
  } catch (error) {
    console.error('Error updating hospital profile:', error);
    res.status(500).json({ message: 'Error updating hospital profile' });
  }
};

// Delete donation field
export const deleteDonation = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await hospitalCollection.updateOne(
      { username },
      { $unset: { donation: "" } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Hospital not found or no donation present' });
    }

    console.log(`Donation removed for ${username}`);
    res.json({ message: 'Donation removed successfully' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Error deleting donation' });
  }
};