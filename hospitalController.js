import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let hospitalCollection;
let patientCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    hospitalCollection = db.collection('Hospitals');
    patientCollection = db.collection('Patients');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Call this function to connect to the database
connectToDatabase();

export const getAllHospitals = async (req, res) => {
  try {
    const allHospitals = await hospitalCollection.find({}).toArray();

    if (!Array.isArray(allHospitals)) {
      return res.status(500).json({ message: 'Invalid data format from database' });
    }

    const allHospitalData = allHospitals.map(hospital => ({
      username: hospital.username,
      location: hospital.location || 'No Location',
      description: hospital.description || 'No Description Available',
      tests_available: hospital.tests_available || ['No tests available'],
      specialties: Array.isArray(hospital.specialties) ? hospital.specialties : [hospital.specialties || 'No specialties available'],
      facilities: Array.isArray(hospital.facilities) ? hospital.facilities : [hospital.facilities || 'No facilities available'],
    }));

    res.json(allHospitalData);
  } catch (error) {
    console.error('Error fetching all hospitals:', error);
    return res.status(500).json({ message: 'Error fetching hospitals data' });
  }
};

export const getRecommendedHospitals = async (req, res) => {
  try {
    const { role, username } = req.query;
    let filter = {};
    let location = '';

    if (role === 'patient') {
      const patient = await db.collection('Patients').findOne({ username });
      if (patient) {
        location = patient.report?.address || '';
      }
    }

    if (role === 'hospital') {
      const hospital = await hospitalCollection.findOne({ username });
      if (hospital) {
        location = hospital.location || '';
      }
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    const hospitals = await hospitalCollection.find(filter).toArray();

    if (!Array.isArray(hospitals)) {
      return res.status(500).json({ message: 'Invalid data format from database' });
    }

    const hospitalData = hospitals.map(hospital => ({
      username: hospital.username || 'Unknown',
      location: hospital.location || 'No Location',
      description: hospital.description || 'No Description Available',
      tests_available: Array.isArray(hospital.tests_available)
        ? hospital.tests_available
        : ['No tests available'],
      specialties: Array.isArray(hospital.specialties)
        ? hospital.specialties
        : [hospital.specialties || 'No specialties available'],
      facilities: Array.isArray(hospital.facilities)
        ? hospital.facilities
        : [hospital.facilities || 'No facilities available'],
    }));

    res.json(hospitalData);
  } catch (error) {
    console.error('Error fetching recommended hospitals:', error);
    return res.status(500).json({ message: 'Error fetching recommended hospitals' });
  }
};