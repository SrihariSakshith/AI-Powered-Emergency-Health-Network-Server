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
    const client = await MongoClient.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    db = client.db(dbName);
    adminCollection = db.collection('Admin');
    hospitalCollection = db.collection('Hospitals');
    patientCollection = db.collection('Patients');
    console.log(`✅ Connected to MongoDB database: ${dbName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit the process if the connection fails
  }
}

connectToDatabase();

export const handleLogin = async (req, res) => {
  const { username, password, role } = req.body;
  console.log('Received login request:', req.body);  // Log the request data

  try {
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (role === 'admin') {
      const admin = await adminCollection.findOne({ username });
      if (admin) {
        const isMatch = await bcrypt.compare(password, admin.password);  // Use bcrypt for hashed password
        if (isMatch) {
          return res.json({ success: true, message: 'Admin login successful!' });
        } else {
          return res.status(401).json({ success: false, message: 'Wrong username or password' });
        }
      } else {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
    }

    if (role === 'hospital') {
      const hospital = await hospitalCollection.findOne({ username });
      if (hospital) {
        const isMatch = await bcrypt.compare(password, hospital.password);  // Use bcrypt for hashed password
        if (isMatch) {
          return res.json({ success: true, message: 'Hospital login successful!' });
        } else {
          return res.status(401).json({ success: false, message: 'Wrong password' });
        }
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password before storing
        await hospitalCollection.insertOne({ username, password: hashedPassword });
        return res.json({ success: true, message: 'New hospital registered and logged in!' });
      }
    }

    if (role === 'patient') {
      const patient = await patientCollection.findOne({ username });
      if (patient) {
        const isMatch = await bcrypt.compare(password, patient.password);  // Use bcrypt for hashed password
        if (isMatch) {
          return res.json({ success: true, message: 'Patient login successful!' });
        } else {
          return res.status(401).json({ success: false, message: 'Wrong password' });
        }
      } else {
        const hashedPassword = await bcrypt.hash(password, 10);  // Hash password before storing
        await patientCollection.insertOne({ username, password: hashedPassword });
        return res.json({ success: true, message: 'New patient registered and logged in!' });
      }
    }

    return res.status(400).json({ success: false, message: 'Invalid role' });

  } catch (error) {
    console.error('Error during login:', error);  // Log the error
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
};