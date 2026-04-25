const firebase = require('firebase/compat/app');
require('firebase/compat/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCkLK9LIvJJvlmL43S2o5sW_g44xy63FsY",
  authDomain: "niet-lostfound.firebaseapp.com",
  projectId: "niet-lostfound",
  storageBucket: "niet-lostfound.firebasestorage.app",
  messagingSenderId: "973024979232",
  appId: "1:973024979232:web:655c0fdf77d7b79189cf45",
  measurementId: "G-JR02CVC7C3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

async function test() {
  try {
    const docRef = await db.collection('lost_reports').add({
      student_name: 'John Doe',
      student_email: 'john.doe@niet.co.in',
      student_phone: '9876543210',
      item_title: 'Test Item',
      description: 'This is a test lost item description that is at least 20 chars.',
      category: 'Electronics',
      last_seen_location: 'Library',
      date_lost: '2026-04-25',
      image_url: null,
      status: 'open',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log('Success:', docRef.id);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();
