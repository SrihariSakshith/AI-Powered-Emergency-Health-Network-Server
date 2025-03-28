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

async function connectToDatabase(retries = 5, delay = 2000) {
  while (retries > 0) {
    try {
      const client = await MongoClient.connect(url, { 
        useNewUrlParser: true, 
        useUnifiedTopology: true, 
        serverSelectionTimeoutMS: 60000 
      });

      db = client.db(dbName);

      // Ensure collections are assigned
      adminCollection = db.collection('Admin');
      hospitalCollection = db.collection('Hospitals');
      patientCollection = db.collection('Patients');

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

// Establish connection on startup
connectToDatabase();

export const handleLogin = async (req, res) => {
  const { username, password, role } = req.body;
  console.log('Received login request:', req.body);

  try {
    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    let collection;
    if (role === 'admin') collection = adminCollection;
    else if (role === 'hospital') collection = hospitalCollection;
    else if (role === 'patient') collection = patientCollection;
    else return res.status(400).json({ success: false, message: 'Invalid role' });

    // 🔥 FIX: Ensure collection is initialized before using it
    if (!collection) {
      console.error('❌ Database collection is undefined for role:', role);
      return res.status(500).json({ success: false, message: 'Server error: Database not initialized' });
    }

    const user = await collection.findOne({ username });

    if (!user) {
      console.log(`No ${role} found with username:`, username);
      const hashedPassword = await bcrypt.hash(password, 10);
      await collection.insertOne({ username, password: hashedPassword });
      return res.json({ success: true, message: `New ${role} registered and logged in!` });
    }

    console.log(`✅ User found:`, user);

    if (!user.password) {
      console.error(`❌ Stored password missing for ${role}:`, user);
      return res.status(500).json({ success: false, message: 'Server error: Missing password' });
    }

    // 🔥 FIX: Ensure passwords are hashed before comparing
    if (!user.password.startsWith('$2b$')) {  // If password is not hashed
      console.warn(`⚠️ Plain text password detected for ${username}. Updating to hashed password.`);
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await collection.updateOne({ username }, { $set: { password: hashedPassword } });
      user.password = hashedPassword; // Update local variable
    }

    // Now, compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`🔍 Password match result:`, isMatch);

    if (isMatch) {
      return res.json({ success: true, message: `${role.charAt(0).toUpperCase() + role.slice(1)} login successful!` });
    } else {
      return res.status(401).json({ success: false, message: 'Wrong username or password' });
    }
  } catch (error) {
    console.error('❌ Error during login:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
};
