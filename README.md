# NIET Lost & Found Portal

A clean, production-ready Lost & Found web portal for NIET College. Built with pure HTML, CSS, and JavaScript, powered by Firebase.

## Features

- **Student Interface** — Browse found items, search/filter, and submit claim requests (no login required)
- **Claim System** — Students fill out ownership proof forms; admin reviews and approves/rejects
- **Admin Dashboard** — Secure login, CRUD operations for items, claims management
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile
- **Smooth Animations** — Intersection Observer-powered scroll animations, hover effects
- **Toast Notifications** — Real-time feedback for all user actions
- **Spam Protection** — Rate limiting on claims, validation on both client and server (Firestore rules)

---

## Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Frontend   | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Backend    | Firebase (Firestore, Storage, Auth)    |
| Hosting    | Firebase Hosting                       |
| Animations | CSS + Intersection Observer            |

---

## Project Structure

```
├── index.html          # Homepage — browse all items
├── item.html           # Item detail + claim form
├── admin.html          # Admin dashboard (login required)
├── css/
│   └── styles.css      # Complete design system
├── js/
│   ├── firebase.js     # Firebase init + DB/Storage/Auth helpers + Toasts
│   ├── app.js          # Student-facing logic (browse, search, filter)
│   └── admin.js        # Admin dashboard logic (CRUD, claims)
├── assets/             # Static assets (if needed)
├── firebase.json       # Firebase Hosting config
├── firestore.rules     # Firestore security rules
├── storage.rules       # Storage security rules
├── seed-data.js        # Sample data seeder script
└── README.md           # This file
```

---

## Firebase Setup Guide

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Name it (e.g., `niet-lost-found`)
4. Disable Google Analytics (not needed) or enable if you want
5. Click **Create project**

### Step 2: Enable Services

#### Firestore Database

1. In Firebase Console → **Build** → **Firestore Database**
2. Click **Create database**
3. Select **Start in production mode**
4. Choose a region close to India (e.g., `asia-south1`)
5. Click **Enable**

#### Authentication

1. Go to **Build** → **Authentication**
2. Click **Get started**
3. Go to **Sign-in method** tab
4. Enable **Email/Password**
5. Go to **Users** tab → **Add user**
6. Enter admin email and password (e.g., `admin@niet.co.in` / `YourSecurePassword123`)

#### Cloud Storage

1. Go to **Build** → **Storage**
2. Click **Get started**
3. Select **Start in production mode**
4. Choose the same region as Firestore

### Step 3: Get Firebase Config

1. Go to **Project Settings** (gear icon) → **General**
2. Scroll down to **"Your apps"** → Click **Web** (`</>` icon)
3. Register the app (name: "NIET Lost & Found")
4. Copy the `firebaseConfig` object

### Step 4: Update Your Code

Open `js/firebase.js` and replace the placeholder config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### Step 5: Deploy Security Rules

#### Option A: Firebase CLI (Recommended)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore, Storage, Hosting)
# When prompted, use existing files — DON'T overwrite!
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage:rules

# Deploy everything
firebase deploy
```

#### Option B: Firebase Console

1. **Firestore Rules**: Go to Firestore → Rules tab → paste contents of `firestore.rules` → Publish
2. **Storage Rules**: Go to Storage → Rules tab → paste contents of `storage.rules` → Publish

### Step 6: Create Firestore Indexes

Go to **Firestore** → **Indexes** tab and create these composite indexes:

| Collection | Fields                                 | Query Scope |
| ---------- | -------------------------------------- | ----------- |
| `items`    | `category` ASC, `date_found` DESC      | Collection  |
| `items`    | `status` ASC, `date_found` DESC        | Collection  |
| `claims`   | `item_id` ASC, `created_at` DESC       | Collection  |
| `claims`   | `student_email` ASC, `created_at` DESC | Collection  |

> **Note**: Firebase will auto-suggest indexes if you see index errors in the browser console. Just click the provided link to create them.

---

## Seed Sample Data

1. Open the app and go to `admin.html`
2. Log in with your admin credentials
3. Open browser DevTools (F12) → Console tab
4. Copy and paste the contents of `seed-data.js`
5. Press Enter
6. Refresh the page

---

## Local Development

You can use any local server to run this:

```bash
# Option 1: Python
python -m http.server 8080

# Option 2: Node.js (npx)
npx serve .

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server

# Option 4: Firebase Emulator
firebase emulators:start
```

---

## Deployment

```bash
# Deploy everything to Firebase Hosting
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only rules
firebase deploy --only firestore:rules,storage:rules
```

Your site will be live at: `https://your-project-id.web.app`

---

## Firestore Data Structure

### `items` collection

```
{
  title: "Blue JBL Earbuds",
  description: "Found near charging station...",
  category: "Electronics",
  location_found: "Library",
  date_found: "2026-04-20",
  image_url: "https://...",
  status: "available" | "claimed" | "returned",
  uploaded_by: "admin@niet.co.in",
  created_at: Timestamp,
  updated_at: Timestamp
}
```

### `claims` collection

```
{
  item_id: "abc123",
  student_name: "Rahul Kumar",
  student_email: "rahul@niet.co.in",
  student_phone: "9876543210",
  proof_description: "It's my blue earbuds with...",
  proof_image: "https://..." | null,
  status: "pending" | "approved" | "rejected",
  created_at: Timestamp,
  resolved_at: Timestamp
}
```

---

## Security Features

- ✅ Admin-only authentication (email/password)
- ✅ Firestore rules enforce read/write permissions
- ✅ Storage rules restrict file types and sizes (max 5MB, images only)
- ✅ Client-side form validation
- ✅ Server-side validation via Firestore security rules
- ✅ Rate limiting on claim submissions (max 3 per 5 minutes per email)
- ✅ HTML escaping to prevent XSS
- ✅ Image compression for large uploads

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## License

Built for NIET College internal use.
