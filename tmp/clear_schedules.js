const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace escaped newlines if any
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function clearSchedules() {
  try {
    const snapshot = await db.collection('schedules').get();
    if (snapshot.empty) {
      console.log('No schedules found.');
      return;
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      console.log(`Deleted Schedule ID: ${doc.id}`);
    });

    await batch.commit();
    console.log('All schedules successfully deleted from Firestore!');
  } catch (err) {
    console.error('Error deleting schedules:', err);
  } finally {
    process.exit(0);
  }
}

clearSchedules();
