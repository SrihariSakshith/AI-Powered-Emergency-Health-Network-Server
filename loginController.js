import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;

let db;
let adminCollection;
let hospitalCollection;
let patientCollection;

async function connectToDatabase() {
  try {
    const client = await MongoClient.connect(url); // Removed deprecated options
    db = client.db(dbName);
    adminCollection = db.collection('Admin');
    hospitalCollection = db.collection('Hospitals');
    patientCollection = db.collection('Patients');
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

connectToDatabase();

export const handleLogin = async (req, res) => {
  const { username, password, role } = req.body;
  console.log('Received login request:', req.body);  // Log the request data

  try {
    if (role === 'admin') {
      const admin = await adminCollection.findOne({ username: username });
      if (admin) {
        // Compare password (using bcrypt if hashed)
        const isMatch = admin.password === password;  // Replace with bcrypt if hashed password
        if (isMatch) {
          return res.json({ success: true, message: 'Admin login successful!' });
        } else {
          return res.json({ success: false, message: 'Wrong username or password' });
        }
      } else {
        return res.json({ success: false, message: 'Admin not found' });
      }
    }

    // hospital login/signup
    if (role === 'hospital') {
      const hospital = await hospitalCollection.findOne({ username: username });
      if (hospital) {
        const isMatch = hospital.password === password;  // Replace with bcrypt if password is hashed
        if (isMatch) {
          return res.json({ success: true, message: 'hospital login successful!' });
        } else {
          return res.json({ success: false, message: 'Wrong password' });
        }
      } else {
        // New hospital registration
        await hospitalCollection.insertOne({ username: username, password: password });
        return res.json({ success: true, message: 'New hospital registered and logged in!' });
      }
    }

    // Patient login/signup
    if (role === 'patient') {
      const patient = await patientCollection.findOne({ username: username });
      if (patient) {
        const isMatch = patient.password === password;  // Replace with bcrypt if password is hashed
        if (isMatch) {
          return res.json({ success: true, message: 'Patient login successful!' });
        } else {
          return res.json({ success: false, message: 'Wrong password' });
        }
      } else {
        // New patient registration
        await patientCollection.insertOne({ username: username, password: password });
        return res.json({ success: true, message: 'New patient registered and logged in!' });
      }
    }

    return res.json({ success: false, message: 'Invalid role' });

  } catch (error) {
    console.error('Error during login:', error);  // Log the error
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
};