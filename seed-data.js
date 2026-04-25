/**
 * NIET Lost & Found — Sample Data Seeder
 * 
 * Run this ONCE in the browser console (on admin.html while logged in)
 * to populate Firestore with dummy items for testing.
 * 
 * Usage:
 *   1. Open admin.html in your browser
 *   2. Log in as admin
 *   3. Open DevTools Console (F12 → Console)
 *   4. Copy-paste this entire script and press Enter
 */

(async function seedData() {
  const sampleItems = [
    {
      title: "Blue JBL Bluetooth Earbuds",
      description: "JBL Tune 230NC TWS earbuds in blue color. Found in a transparent case near the charging station. Left side earbud has a small scratch.",
      category: "Electronics",
      location_found: "Library",
      date_found: "2026-04-20",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Student ID Card — Priya Sharma",
      description: "NIET student ID card belonging to Priya Sharma, B.Tech CSE, Roll No. 2024XXXXX. Found near entrance gate.",
      category: "ID Cards & Documents",
      location_found: "Main Building",
      date_found: "2026-04-22",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Black Laptop Bag (HP Branded)",
      description: "Black HP-branded laptop backpack with multiple compartments. Contains a charger cable and a notebook inside. No laptop found.",
      category: "Bags & Wallets",
      location_found: "Cafeteria",
      date_found: "2026-04-18",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Engineering Mathematics Textbook",
      description: "Higher Engineering Mathematics by B.S. Grewal, 44th edition. Has some highlighting in chapters 4 and 7. Name written on first page is partially illegible.",
      category: "Books & Notes",
      location_found: "Lab Block",
      date_found: "2026-04-15",
      status: "claimed",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Silver Casio Watch",
      description: "Casio A168WA classic silver digital watch. Minor scratches on the back. Battery is still working.",
      category: "Accessories",
      location_found: "Sports Ground",
      date_found: "2026-04-21",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Set of 3 Keys with Honda Keychain",
      description: "Three keys on a ring with a red Honda keychain. One appears to be a room key, one padlock key, one vehicle key.",
      category: "Keys",
      location_found: "Parking Area",
      date_found: "2026-04-23",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Green Milton Water Bottle (1L)",
      description: "Green Milton Thermosteel water bottle, 1 litre capacity. Has 'Rahul' written with marker on the bottom.",
      category: "Water Bottles",
      location_found: "Auditorium",
      date_found: "2026-04-19",
      status: "returned",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "White Lab Coat (Size M)",
      description: "White lab coat, medium size. Has a chemistry department logo patch. Found after the afternoon lab session.",
      category: "Clothing",
      location_found: "Lab Block",
      date_found: "2026-04-24",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Scientific Calculator (Casio fx-991EX)",
      description: "Casio fx-991EX Classwiz scientific calculator with slide cover. Working condition. Found on second floor bench.",
      category: "Stationery",
      location_found: "Main Building",
      date_found: "2026-04-22",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Badminton Racket (Yonex)",
      description: "Yonex Nanoray 10 badminton racket with a blue grip. Slight wear on strings. No cover found.",
      category: "Sports Equipment",
      location_found: "Sports Ground",
      date_found: "2026-04-17",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "Brown Leather Wallet",
      description: "Small brown leather bifold wallet. Contains no cash or cards. Has a faded monogram 'AK' on the inside flap.",
      category: "Bags & Wallets",
      location_found: "Hostel",
      date_found: "2026-04-25",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    },
    {
      title: "USB-C Charging Cable (1m, white)",
      description: "White USB-C to USB-C charging cable, approximately 1 meter. No brand markings visible. Found wrapped near socket.",
      category: "Electronics",
      location_found: "Library",
      date_found: "2026-04-23",
      status: "available",
      image_url: "",
      uploaded_by: "admin@niet.co.in"
    }
  ];

  console.log('🌱 Seeding Firestore with sample items...');

  let count = 0;
  for (const item of sampleItems) {
    try {
      await db.collection('items').add({
        ...item,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      count++;
      console.log(`  ✅ Added: ${item.title}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${item.title}`, err);
    }
  }

  console.log(`\n🎉 Done! ${count}/${sampleItems.length} items seeded.`);
  console.log('Refresh the page to see them.');
})();
