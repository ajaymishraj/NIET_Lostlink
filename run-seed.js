const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyCkLK9LIvJJvlmL43S2o5sW_g44xy63FsY",
  authDomain: "niet-lostfound.firebaseapp.com",
  projectId: "niet-lostfound",
  storageBucket: "niet-lostfound.firebasestorage.app",
  messagingSenderId: "973024979232",
  appId: "1:973024979232:web:655c0fdf77d7b79189cf45",
  measurementId: "G-JR02CVC7C3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const sampleItems = [
    {
      title: "Blue JBL Bluetooth Earbuds",
      description: "JBL Tune 230NC TWS earbuds in blue color. Found in a transparent case near the charging station. Left side earbud has a small scratch.",
      category: "Electronics",
      location_found: "Library",
      date_found: "2026-04-20",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Student ID Card — Priya Sharma",
      description: "NIET student ID card belonging to Priya Sharma, B.Tech CSE, Roll No. 2024XXXXX. Found near entrance gate.",
      category: "ID Cards & Documents",
      location_found: "Main Building",
      date_found: "2026-04-22",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Black Laptop Bag (HP Branded)",
      description: "Black HP-branded laptop backpack with multiple compartments. Contains a charger cable and a notebook inside. No laptop found.",
      category: "Bags & Wallets",
      location_found: "Cafeteria",
      date_found: "2026-04-18",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Engineering Mathematics Textbook",
      description: "Higher Engineering Mathematics by B.S. Grewal, 44th edition. Has some highlighting in chapters 4 and 7. Name written on first page is partially illegible.",
      category: "Books & Notes",
      location_found: "Lab Block",
      date_found: "2026-04-15",
      status: "claimed",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Silver Casio Watch",
      description: "Casio A168WA classic silver digital watch. Minor scratches on the back. Battery is still working.",
      category: "Accessories",
      location_found: "Sports Ground",
      date_found: "2026-04-21",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Set of 3 Keys with Honda Keychain",
      description: "Three keys on a ring with a red Honda keychain. One appears to be a room key, one padlock key, one vehicle key.",
      category: "Keys",
      location_found: "Parking Area",
      date_found: "2026-04-23",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Green Milton Water Bottle (1L)",
      description: "Green Milton Thermosteel water bottle, 1 litre capacity. Has 'Rahul' written with marker on the bottom.",
      category: "Water Bottles",
      location_found: "Auditorium",
      date_found: "2026-04-19",
      status: "returned",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "White Lab Coat (Size M)",
      description: "White lab coat, medium size. Has a chemistry department logo patch. Found after the afternoon lab session.",
      category: "Clothing",
      location_found: "Lab Block",
      date_found: "2026-04-24",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Scientific Calculator (Casio fx-991EX)",
      description: "Casio fx-991EX Classwiz scientific calculator with slide cover. Working condition. Found on second floor bench.",
      category: "Stationery",
      location_found: "Main Building",
      date_found: "2026-04-22",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Badminton Racket (Yonex)",
      description: "Yonex Nanoray 10 badminton racket with a blue grip. Slight wear on strings. No cover found.",
      category: "Sports Equipment",
      location_found: "Sports Ground",
      date_found: "2026-04-17",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Brown Leather Wallet",
      description: "Small brown leather bifold wallet. Contains no cash or cards. Has a faded monogram 'AK' on the inside flap.",
      category: "Bags & Wallets",
      location_found: "Hostel",
      date_found: "2026-04-25",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "USB-C Charging Cable (1m, white)",
      description: "White USB-C to USB-C charging cable, approximately 1 meter. No brand markings visible. Found wrapped near socket.",
      category: "Electronics",
      location_found: "Library",
      date_found: "2026-04-23",
      status: "available",
      uploaded_by: "admin@niet.co.in"
    }
];

async function run() {
  console.log('Seeding data to Firestore...');
  const itemsRef = collection(db, 'items');
  for (const item of sampleItems) {
    try {
      await addDoc(itemsRef, {
        ...item,
        date_found: Timestamp.fromDate(new Date(item.date_found)),
        created_at: serverTimestamp()
      });
      console.log(`Success: ${item.title}`);
    } catch (e) {
      console.error(`Error adding ${item.title}: `, e);
    }
  }
  console.log('Finished!');
  process.exit(0);
}

run();
