// ============================================
// Firebase Configuration & Initialization
// ============================================

// ⚠️ REPLACE with your own Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCkLK9LIvJJvlmL43S2o5sW_g44xy63FsY",
  authDomain: "niet-lostfound.firebaseapp.com",
  projectId: "niet-lostfound",
  storageBucket: "niet-lostfound.firebasestorage.app",
  messagingSenderId: "973024979232",
  appId: "1:973024979232:web:655c0fdf77d7b79189cf45",
  measurementId: "G-JR02CVC7C3"
};

// Initialize Firebase (using compat SDKs from CDN)
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// ============================================
// Firestore Helpers
// ============================================

const ItemsDB = {
  /**
   * Get all items, optionally filtered
   */
  async getAll(filters = {}) {
    let query = db.collection('items').orderBy('date_found', 'desc');

    if (filters.category && filters.category !== 'all') {
      query = query.where('category', '==', filters.category);
    }
    if (filters.status && filters.status !== 'all') {
      query = query.where('status', '==', filters.status);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Get a single item by ID
   */
  async getById(id) {
    const doc = await db.collection('items').doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  },

  /**
   * Add a new item (admin only)
   */
  async add(data) {
    const docRef = await db.collection('items').add({
      ...data,
      status: data.status || 'available',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  },

  /**
   * Update an item (admin only)
   */
  async update(id, data) {
    await db.collection('items').doc(id).update({
      ...data,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  /**
   * Delete an item (admin only)
   */
  async delete(id) {
    await db.collection('items').doc(id).delete();
  },

  /**
   * Get item counts by status
   */
  async getCounts() {
    const snapshot = await db.collection('items').get();
    const counts = { total: 0, available: 0, claimed: 0, returned: 0 };
    snapshot.docs.forEach(doc => {
      counts.total++;
      const status = doc.data().status || 'available';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  },

  /**
   * Search items by title (client-side filter after fetch)
   */
  async search(query, items = null) {
    if (!items) {
      items = await this.getAll();
    }
    const q = query.toLowerCase().trim();
    if (!q) return items;
    return items.filter(item =>
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q)) ||
      (item.location_found && item.location_found.toLowerCase().includes(q))
    );
  }
};

const ClaimsDB = {
  /**
   * Submit a new claim (public)
   */
  async submit(data) {
    // Basic spam prevention: rate limit by email
    const recent = await db.collection('claims')
      .where('student_email', '==', data.student_email)
      .where('created_at', '>', new Date(Date.now() - 5 * 60 * 1000))
      .get();

    if (recent.size >= 3) {
      throw new Error('Too many requests. Please wait a few minutes before submitting another claim.');
    }

    const docRef = await db.collection('claims').add({
      ...data,
      status: 'pending',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  },

  /**
   * Get all claims (admin only)
   */
  async getAll() {
    const snapshot = await db.collection('claims')
      .orderBy('created_at', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Get claims for a specific item
   */
  async getByItemId(itemId) {
    const snapshot = await db.collection('claims')
      .where('item_id', '==', itemId)
      .orderBy('created_at', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Update claim status (admin only)
   */
  async updateStatus(claimId, status) {
    await db.collection('claims').doc(claimId).update({
      status,
      resolved_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  /**
   * Get claim counts
   */
  async getCounts() {
    const snapshot = await db.collection('claims').get();
    const counts = { total: 0, pending: 0, approved: 0, rejected: 0 };
    snapshot.docs.forEach(doc => {
      counts.total++;
      const status = doc.data().status || 'pending';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }
};

const LostReportsDB = {
  /**
   * Submit a lost item report (public)
   */
  async submit(data) {
    // Basic spam prevention: rate limit by email
    const recent = await db.collection('lost_reports')
      .where('student_email', '==', data.student_email)
      .where('created_at', '>', new Date(Date.now() - 5 * 60 * 1000))
      .get();

    if (recent.size >= 3) {
      throw new Error('Too many requests. Please wait a few minutes before submitting another report.');
    }

    const docRef = await db.collection('lost_reports').add({
      ...data,
      status: 'open',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
  },

  /**
   * Get all lost reports (admin only)
   */
  async getAll() {
    const snapshot = await db.collection('lost_reports')
      .orderBy('created_at', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Update report status (admin only)
   */
  async updateStatus(reportId, status) {
    await db.collection('lost_reports').doc(reportId).update({
      status,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  /**
   * Get report counts
   */
  async getCounts() {
    const snapshot = await db.collection('lost_reports').get();
    const counts = { total: 0, open: 0, matched: 0, closed: 0 };
    snapshot.docs.forEach(doc => {
      counts.total++;
      const status = doc.data().status || 'open';
      if (counts[status] !== undefined) counts[status]++;
    });
    return counts;
  }
};

// ============================================
// Storage Helpers
// ============================================

const StorageHelper = {
  /**
   * Upload an image file and return its download URL
   */
  async uploadImage(file, folder = 'items') {
    const ext = file.name.split('.').pop();
    const filename = `${folder}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${ext}`;
    const ref = storage.ref(filename);

    // Compress if image is too large (> 2MB)
    let uploadFile = file;
    if (file.size > 2 * 1024 * 1024 && file.type.startsWith('image/')) {
      uploadFile = await this.compressImage(file, 0.7, 1200);
    }

    const snapshot = await ref.put(uploadFile);
    return await snapshot.ref.getDownloadURL();
  },

  /**
   * Basic image compression using canvas
   */
  compressImage(file, quality = 0.7, maxWidth = 1200) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }
};

// ============================================
// Auth Helpers
// ============================================

const AuthHelper = {
  /**
   * Sign in admin with email/password
   */
  async login(email, password) {
    return await auth.signInWithEmailAndPassword(email, password);
  },

  /**
   * Sign out
   */
  async logout() {
    return await auth.signOut();
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }
};

// ============================================
// Toast Notification System
// ============================================

const Toast = {
  container: null,

  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(type, title, message = '', duration = 4000) {
    this.init();

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast__icon">${icons[type] || icons.info}</span>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        ${message ? `<div class="toast__message">${message}</div>` : ''}
      </div>
      <button class="toast__close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    toast.querySelector('.toast__close').addEventListener('click', () => {
      this.dismiss(toast);
    });

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  },

  success(title, msg) { return this.show('success', title, msg); },
  error(title, msg) { return this.show('error', title, msg); },
  warning(title, msg) { return this.show('warning', title, msg); },
  info(title, msg) { return this.show('info', title, msg); }
};

// ============================================
// Utility Functions
// ============================================

const Utils = {
  /**
   * Format a Firestore timestamp or date string
   */
  formatDate(date) {
    if (!date) return '—';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  /**
   * Format relative time
   */
  timeAgo(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return this.formatDate(date);
  },

  /**
   * Debounce function
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Validate email
   */
  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  /**
   * Validate phone (Indian format)
   */
  isValidPhone(phone) {
    return /^[6-9]\d{9}$/.test(phone.replace(/[\s-]/g, ''));
  },

  /**
   * Sanitize HTML to prevent XSS
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Get URL parameter
   */
  getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  /**
   * Category list
   */
  categories: [
    'Electronics',
    'Books & Notes',
    'ID Cards & Documents',
    'Clothing',
    'Accessories',
    'Bags & Wallets',
    'Keys',
    'Water Bottles',
    'Stationery',
    'Sports Equipment',
    'Other'
  ],

  /**
   * Location list 
   */
  locations: [
    'Main Building',
    'Library',
    'Cafeteria',
    'Auditorium',
    'Lab Block',
    'Sports Ground',
    'Parking Area',
    'Hostel',
    'Admin Block',
    'Workshop',
    'Other'
  ]
};
