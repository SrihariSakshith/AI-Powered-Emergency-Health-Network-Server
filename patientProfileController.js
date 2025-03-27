import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let patientsCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url); // Removed deprecated options
    db = client.db(dbName);
    patientsCollection = db.collection('Patients');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectToDatabase();

// Get patient profile by username
export const getPatient = async (req, res) => {
  try {
    const { username } = req.params;
    const patient = await patientsCollection.findOne({ username });

    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    res.json({
      report: patient.report || {},
      donation: patient.donation || '',
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ message: 'Error fetching patient data' });
  }
};

// Update patient profile
export const updatePatient = async (req, res) => {
  try {
    const { username } = req.params;
    const { report, donation } = req.body;

    if (!report && donation === undefined) {
      return res.status(400).json({ message: 'At least one of report or donation data is required' });
    }

    const updateFields = {};
    if (report) {
      updateFields.report = {
        blood_group: report.blood_group,
        weight: report.weight,
        age: report.age,
        address: report.address,
        phone: report.phone,
        email: report.email,
        medical_conditions: report.medical_conditions,
      };
    }

    if (donation !== undefined) {
      updateFields.donation = donation;
    }

    const result = await patientsCollection.updateOne(
      { username },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Patient not found or no changes made' });
    }

    res.json(await patientsCollection.findOne({ username }));
  } catch (error) {
    console.error('Error updating patient data:', error);
    res.status(500).json({ message: 'Error updating patient data' });
  }
};

// Remove the donation status
export const deleteDonation = async (req, res) => {
  try {
    const { username } = req.params;

    const result = await patientsCollection.updateOne(
      { username },
      { $unset: { donation: '' } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Patient not found or no changes made' });
    }

    res.json({ message: 'Donation status removed successfully' });
  } catch (error) {
    console.error('Error removing donation status:', error);
    res.status(500).json({ message: 'Error removing donation status' });
  }
};