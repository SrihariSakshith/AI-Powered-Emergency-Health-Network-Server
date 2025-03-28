import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let hospitalsCollection;
let patientsCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url); // Removed deprecated options
    db = client.db(dbName);
    hospitalsCollection = db.collection('Hospitals');
    patientsCollection = db.collection('Patients');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectToDatabase();

// Fetch donors data from both Hospitals and Patients collections
export const getDonors = async (req, res) => {
  try {
    // Fetch data from Patients collection
    console.log('Fetching donors data...');
    const patients = await patientsCollection.find({ donation: { $exists: true, $ne: '' } }).toArray();
    const patientsData = patients.map(patient => ({
      username: patient.username,
      email: patient.report?.email || 'Not Available', // Default email if missing
      location: patient.report?.address || 'Not Available', // Default location if missing
      donation: patient.donation || 'Not Available' // Default donation message if missing
    }));

    // Fetch data from Hospitals collection
    const hospitals = await hospitalsCollection.find({ donation: { $exists: true, $ne: '' } }).toArray();
    const hospitalsData = hospitals.map(hospital => ({
      username: hospital.username,
      email: hospital.email || 'Not Available', // Default email if missing
      location: hospital.location || 'Not Available', // Default location if missing
      donation: hospital.donation || 'Not Available' // Default donation message if missing
    }));

    // Combine both data arrays (Patients and Hospitals)
    const allDonors = [...patientsData, ...hospitalsData];

    // Send the combined data as JSON response
    res.json(allDonors);
  } catch (error) {
    console.error('Error fetching donors:', error);
    return res.status(500).json({ message: 'Error fetching donors data' });
  }
};

export const getUserLocation = async (req, res) => {
  const { username, role } = req.query;

  if (!username || !role) {
    return res.status(400).json({ message: 'Username and role are required' });
  }

  try {
    if (role === 'patient') {
      const patient = await patientsCollection.findOne({ username });
      if (patient && patient.report?.address) {
        return res.json({ location: patient.report.address });
      }
    } else if (role === 'hospital') {
      const hospital = await hospitalsCollection.findOne({ username });
      if (hospital && hospital.location) {
        return res.json({ location: hospital.location });
      }
    }

    return res.status(404).json({ message: 'Location not found' });
  } catch (error) {
    console.error('Error fetching user location:', error);
    return res.status(500).json({ message: 'Error fetching user location' });
  }
};

export const getUserBloodGroup = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    const patient = await patientsCollection.findOne({ username });
    if (patient && patient.report?.blood_group) {
      return res.json({ blood_group: patient.report.blood_group });
    }

    return res.status(404).json({ message: 'Blood group not found' });
  } catch (error) {
    console.error('Error fetching user blood group:', error);
    return res.status(500).json({ message: 'Error fetching user blood group' });
  }
};