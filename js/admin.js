// ============================================
// NIET Lost & Found — Admin Dashboard Logic
// (Redesigned for Material Design 3 layout)
// ============================================

(function () {
  "use strict";

  // ============================================
  // State
  // ============================================

  let currentView = "dashboard";
  let adminItems = [];
  let adminClaims = [];
  let adminReports = [];
  let editingItemId = null;
  let isDashboardInitialized = false;

  // ============================================
  // DOM Helpers
  // ============================================

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ============================================
  // Initialize
  // ============================================

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    setupAuth();
    initAOS();
  });

  // ============================================
  // Theme Toggle Logic
  // ============================================

  function initTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const currentTheme = localStorage.getItem("theme") || "light";

    document.documentElement.setAttribute("data-theme", currentTheme);

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const theme = document.documentElement.getAttribute("data-theme");
        const newTheme = theme === "light" ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
      });
    }
  }

  // ============================================
  // AOS Initialization
  // ============================================

  function initAOS() {
    if (typeof AOS !== "undefined") {
      AOS.init({
        duration: 800,
        once: true,
        offset: 50,
      });
    }
  }

  function setupAuth() {
    const loginForm = document.getElementById("login-form");
    const loginScreen = document.getElementById("auth-screen");
    const dashboard = document.getElementById("admin-dashboard");

    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        const btn = loginForm.querySelector('button[type="submit"]');

        btn.disabled = true;
        btn.innerHTML = '<span class="btn__spinner"></span> Signing in...';

        try {
          await AuthHelper.login(email, password);
          Toast.success("Welcome back!", "Signed in successfully.");
        } catch (err) {
          console.error("Login error:", err);
          Toast.error("Login failed", getAuthError(err.code));
        } finally {
          btn.disabled = false;
          btn.textContent = "Sign In";
        }
      });
    }

    AuthHelper.onAuthStateChanged((user) => {
      if (user) {
        if (loginScreen) loginScreen.classList.add("hidden");
        if (dashboard) dashboard.classList.remove("hidden");
        initDashboard();
      } else {
        if (loginScreen) loginScreen.classList.remove("hidden");
        if (dashboard) dashboard.classList.add("hidden");
      }
    });
  }

  function getAuthError(code) {
    const errors = {
      "auth/invalid-email": "Invalid email address.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password.",
      "auth/invalid-credential": "Invalid credentials.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
    };
    return errors[code] || "An unexpected error occurred.";
  }

  // ============================================
  // Dashboard Init
  // ============================================

  async function initDashboard() {
    if (isDashboardInitialized) return;
    isDashboardInitialized = true;

    bindSidebarEvents();
    bindAdminEvents();
    initMobileSidebar();
    await switchView("dashboard");
    // Make admin tables responsive (convert to card view on small screens)
    makeAdminTablesResponsive();
  }

  // Convert admin tables into accessible card layout on small screens.
  function makeAdminTablesResponsive() {
    const breakpoint = 640;
    const tables = document.querySelectorAll('.adm-table');

    function debounce(fn, wait) {
      let t;
      return function (...args) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }

    function update() {
      const isSmall = window.innerWidth <= breakpoint;
      tables.forEach((table) => {
        const wrapper = table.closest('.adm-table-card') || table.parentElement;
        const headers = Array.from(table.querySelectorAll('thead th')).map(
          (th) => th.textContent.trim(),
        );

        if (isSmall) {
          if (wrapper) wrapper.classList.add('adm-table-to-cards');
          table.querySelectorAll('tbody tr').forEach((tr) => {
            Array.from(tr.children).forEach((td, i) => {
              td.setAttribute('data-label', headers[i] || '');
            });
          });
        } else {
          if (wrapper) wrapper.classList.remove('adm-table-to-cards');
          table.querySelectorAll('tbody tr td').forEach((td) => {
            td.removeAttribute('data-label');
          });
        }
      });
    }

    update();
    window.addEventListener('resize', debounce(update, 160));
  }

  function initMobileSidebar() {
    const sidebar = document.getElementById("adm-sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    const toggle = document.getElementById("sidebar-toggle");
    const logoutMobile = document.getElementById("admin-logout-mobile");

    if (toggle && sidebar && overlay) {
      toggle.addEventListener("click", () => {
        sidebar.classList.add("open");
        overlay.classList.add("active");
      });

      overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("active");
      });
    }

    if (logoutMobile) {
      logoutMobile.addEventListener("click", async () => {
        await AuthHelper.logout();
        Toast.info("Signed out", "You have been logged out.");
      });
    }

    // "View All" / "Manage All" links on dashboard
    document.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const view = btn.dataset.goto;
        const sidebarLink = document.querySelector(
          `.adm-sidebar__link[data-view="${view}"]`,
        );
        if (sidebarLink) sidebarLink.click();
      });
    });
  }

  function bindSidebarEvents() {
    // Sidebar nav links
    $$(".adm-sidebar__link[data-view]").forEach((link) => {
      link.addEventListener("click", () => {
        switchView(link.dataset.view);
        // Close mobile sidebar
        const sidebar = document.getElementById("adm-sidebar");
        const overlay = document.getElementById("sidebar-overlay");
        if (sidebar) sidebar.classList.remove("open");
        if (overlay) overlay.classList.remove("active");
      });
    });

    // Logout
    const logoutBtn = document.getElementById("admin-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        await AuthHelper.logout();
        Toast.info("Signed out", "You have been logged out.");
      });
    }
  }

  function bindAdminEvents() {
    // Add item button
    const addBtn = document.getElementById("add-item-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => openItemModal());
    }

    // Item form submit
    const itemForm = document.getElementById("item-form");
    if (itemForm) {
      itemForm.addEventListener("submit", handleItemFormSubmit);
    }

    // Modal close buttons
    $$("[data-close-modal]").forEach((btn) => {
      btn.addEventListener("click", () => closeAllModals());
    });

    // Close modal on overlay click
    $$(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // Image preview for item form
    const itemImageInput = document.getElementById("item-image");
    if (itemImageInput) {
      itemImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        const preview = document.getElementById("item-image-preview");
        if (file && preview) {
          if (file.size > 5 * 1024 * 1024) {
            Toast.error(
              "File too large",
              "Please upload an image under 5MB.",
            );
            itemImageInput.value = "";
            return;
          }
          const reader = new FileReader();
          reader.onload = (ev) => {
            preview.innerHTML = `<img src="${ev.target.result}" alt="Preview">`;
            preview.classList.add("active");
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // ============================================
  // View Switching
  // ============================================

  async function switchView(view) {
    currentView = view;

    // Update sidebar active state
    $$(".adm-sidebar__link[data-view]").forEach((link) => {
      link.classList.toggle(
        "adm-sidebar__link--active",
        link.dataset.view === view,
      );
    });

    // Show/hide content panels
    $$(".admin-panel").forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.panel !== view);
    });

    // Load data
    if (view === "dashboard") {
      await loadDashboard();
    } else if (view === "items") {
      await loadAdminItems();
    } else if (view === "claims") {
      await loadAdminClaims();
    } else if (view === "reports") {
      await loadAdminReports();
    }
  }

  // ============================================
  // DASHBOARD (overview)
  // ============================================

  async function loadDashboard() {
    try {
      // Load all items and claims first (since we need them for recent listings anyway)
      const [allAdminItems, allAdminClaims] = await Promise.all([
        ItemsDB.getAll(),
        ClaimsDB.getAll(),
      ]);

      adminItems = allAdminItems;
      adminClaims = allAdminClaims;

      // Compute metrics client-side from the loaded data to avoid double fetch
      const [itemCounts, claimCounts] = await Promise.all([
        ItemsDB.getCounts(adminItems),
        ClaimsDB.getCounts(allAdminClaims),
      ]);

      const dashTotal = document.getElementById("dash-total");
      const dashAvailSub = document.getElementById("dash-available-sub");
      const dashClaims = document.getElementById("dash-claims");
      const dashClaimsSub = document.getElementById("dash-claims-sub");
      const dashReturned = document.getElementById("dash-returned");
      const dashReturnedSub = document.getElementById("dash-returned-sub");

      if (dashTotal) dashTotal.textContent = itemCounts.total;
      if (dashAvailSub)
        dashAvailSub.textContent = `${itemCounts.available} currently available`;
      if (dashClaims) dashClaims.textContent = claimCounts.pending;
      if (dashClaimsSub) {
        dashClaimsSub.innerHTML =
          claimCounts.pending > 0
            ? `<span class="material-symbols-outlined" style="font-size:14px">priority_high</span> ${claimCounts.pending} require review`
            : "All clear";
      }
      if (dashReturned) dashReturned.textContent = itemCounts.returned;
      if (dashReturnedSub)
        dashReturnedSub.textContent = `${itemCounts.claimed} claimed`;

      renderDashboardItems(adminItems.slice(0, 4));
      await renderDashboardClaims(
        adminClaims.filter((c) => c.status === "pending").slice(0, 3),
      );
    } catch (err) {
      console.error("Dashboard load error:", err);
      const errMessage = err.code === "permission-denied"
        ? "Access Denied: You do not have administrator permissions."
        : "Failed to load dashboard data. Please try again.";
      Toast.error("Load Error", errMessage);

      const elementsToFail = [
        "dash-available-sub",
        "dash-claims-sub",
        "dash-returned-sub"
      ];
      elementsToFail.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "Error loading";
      });

      const containersToFail = [
        "dash-claims-list",
        "dash-items-list"
      ];
      containersToFail.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<div class="adm-empty-inline" style="color:var(--danger)">${errMessage}</div>`;
      });

      if (err.code === "permission-denied") {
        AuthHelper.logout();
      }
    }
  }

  function renderDashboardItems(items) {
    const container = document.getElementById("dash-items-list");
    if (!container) return;

    if (items.length === 0) {
      container.innerHTML =
        '<div class="adm-empty-inline">No items logged yet.</div>';
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const statusMap = {
          available: "unclaimed",
          claimed: "claimed",
          returned: "returned",
        };
        const badgeClass = statusMap[item.status] || "unclaimed";
        const statusLabel =
          item.status === "available"
            ? "Unclaimed"
            : item.status || "Unclaimed";

        return `
        <div class="adm-inv-item">
          <div class="adm-inv-item__img">
            ${
              item.image_url
                ? `<img src="${item.image_url}" alt="${Utils.escapeHtml(item.title)}" loading="lazy">`
                : `<span class="material-symbols-outlined" style="font-size:24px">inventory_2</span>`
            }
          </div>
          <div class="adm-inv-item__info">
            <div class="adm-inv-item__top">
              <span class="adm-inv-item__name">${Utils.escapeHtml(item.title)}</span>
              <span class="adm-inv-badge adm-inv-badge--${badgeClass}">${statusLabel}</span>
            </div>
            <div class="adm-inv-item__loc">${Utils.escapeHtml(item.location_found || "Unknown location")}</div>
            <div class="adm-inv-item__time">Logged: ${Utils.timeAgo(item.created_at || item.date_found)}</div>
          </div>
        </div>
      `;
      })
      .join("");
  }

  async function renderDashboardClaims(claims) {
    const container = document.getElementById("dash-claims-list");
    if (!container) return;

    if (claims.length === 0) {
      container.innerHTML =
        '<div class="adm-empty-inline">No pending claims right now. 🎉</div>';
      return;
    }

    // Pre-load item titles
    const itemTitles = {};
    for (const c of claims) {
      if (!itemTitles[c.item_id]) {
        try {
          const item = await ItemsDB.getById(c.item_id);
          itemTitles[c.item_id] = item ? item.title : "Unknown Item";
        } catch {
          itemTitles[c.item_id] = "Unknown";
        }
      }
    }

    const avatarColors = ["blue", "red", "green"];

    container.innerHTML = claims
      .map((claim, i) => {
        const initials = (claim.student_name || "??")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        const color = avatarColors[i % avatarColors.length];

        return `
        <div class="adm-claim-card">
          <div class="adm-claim-card__header">
            <div class="adm-claim-card__student">
              <div class="adm-claim-card__avatar adm-claim-card__avatar--${color}">${initials}</div>
              <div>
                <div class="adm-claim-card__name">${Utils.escapeHtml(claim.student_name)}</div>
                <div class="adm-claim-card__email">${Utils.escapeHtml(claim.student_email)}</div>
              </div>
            </div>
            <span class="adm-badge adm-badge--pending">
              <span class="material-symbols-outlined" style="font-size:14px">hourglass_empty</span>
              Pending
            </span>
          </div>
          <div class="adm-claim-card__item">
            <div class="adm-claim-card__thumb">
              <span class="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <div class="adm-claim-card__item-name">${Utils.escapeHtml(itemTitles[claim.item_id] || "Unknown")}</div>
              <div class="adm-claim-card__item-loc">${Utils.timeAgo(claim.created_at)}</div>
            </div>
          </div>
          <div class="adm-claim-card__actions">
            <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.viewClaim('${claim.id}')">View Details</button>
            <button class="adm-btn adm-btn--primary adm-btn--sm" onclick="AdminActions.approveClaim('${claim.id}')">Approve</button>
          </div>
        </div>
      `;
      })
      .join("");
  }

  // ============================================
  // ITEMS MANAGEMENT
  // ============================================

  async function loadAdminItems() {
    const tableBody = document.getElementById("items-table-body");
    const emptyState = document.getElementById("items-empty-admin");
    if (!tableBody) return;

    tableBody.innerHTML =
      '<tr><td colspan="6" class="adm-table-empty">Loading items...</td></tr>';

    try {
      adminItems = await ItemsDB.getAll();

      if (adminItems.length === 0) {
        tableBody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");

      tableBody.innerHTML = adminItems
        .map(
          (item) => `
        <tr>
          <td>
            ${
              item.image_url
                ? `<img src="${item.image_url}" alt="" class="adm-table__thumb">`
                : `<div class="adm-table__thumb" style="background:var(--adm-surface-container);display:flex;align-items:center;justify-content:center;color:var(--adm-outline)">
                  <span class="material-symbols-outlined" style="font-size:18px">image</span>
                </div>`
            }
          </td>
          <td>
            <strong>${Utils.escapeHtml(item.title)}</strong><br>
            <small style="color:var(--adm-outline)">${Utils.escapeHtml(item.category || "")}</small>
          </td>
          <td>${Utils.escapeHtml(item.location_found || "—")}</td>
          <td>${Utils.formatDate(item.date_found)}</td>
          <td><span class="adm-badge adm-badge--${item.status || "available"}">${item.status || "available"}</span></td>
          <td>
            <div class="adm-table__actions">
              <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.editItem('${item.id}')" title="Edit">
                <span class="material-symbols-outlined" style="font-size:16px">edit</span>
              </button>
              <button class="adm-btn adm-btn--danger-outline adm-btn--sm" onclick="AdminActions.deleteItem('${item.id}')" title="Delete">
                <span class="material-symbols-outlined" style="font-size:16px">delete</span>
              </button>
              ${
                item.status === "claimed"
                  ? `<button class="adm-btn adm-btn--success adm-btn--sm" onclick="AdminActions.markReturned('${item.id}')" title="Returned">
                    <span class="material-symbols-outlined" style="font-size:16px">undo</span>
                  </button>`
                  : ""
              }
            </div>
          </td>
        </tr>
      `,
        )
        .join("");
    } catch (err) {
      console.error("Failed to load items:", err);
      const errMessage = err.code === "permission-denied"
        ? "Access Denied: You do not have permission to view items."
        : "Failed to load items.";
      Toast.error("Error", errMessage);
      tableBody.innerHTML = `<tr><td colspan="6" class="adm-table-empty" style="color:var(--danger)">${errMessage}</td></tr>`;
      if (err.code === "permission-denied") {
        AuthHelper.logout();
      }
    }
  }

  // ============================================
  // Item Modal
  // ============================================

  function openItemModal(itemId = null) {
    editingItemId = itemId;
    const modal = document.getElementById("item-modal");
    const form = document.getElementById("item-form");
    const title = document.getElementById("item-modal-title");
    const preview = document.getElementById("item-image-preview");

    if (!modal || !form) return;

    form.reset();
    if (preview) {
      preview.innerHTML = "";
      preview.classList.remove("active");
    }

    // Populate selects
    const catSelect = document.getElementById("item-category");
    if (catSelect && catSelect.options.length <= 1) {
      Utils.categories.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        catSelect.appendChild(opt);
      });
    }

    const locSelect = document.getElementById("item-location");
    if (locSelect && locSelect.options.length <= 1) {
      Utils.locations.forEach((loc) => {
        const opt = document.createElement("option");
        opt.value = loc;
        opt.textContent = loc;
        locSelect.appendChild(opt);
      });
    }

    if (itemId) {
      title.textContent = "Edit Item";
      const item = adminItems.find((i) => i.id === itemId);
      if (item) {
        document.getElementById("item-title").value = item.title || "";
        document.getElementById("item-description").value =
          item.description || "";
        if (catSelect) catSelect.value = item.category || "";
        if (locSelect) locSelect.value = item.location_found || "";
        document.getElementById("item-date").value = item.date_found?.toDate
          ? item.date_found.toDate().toISOString().split("T")[0]
          : item.date_found || "";
        document.getElementById("item-status-field").value =
          item.status || "available";
        if (item.image_url && preview) {
          preview.innerHTML = `<img src="${item.image_url}" alt="Current image">`;
          preview.classList.add("active");
        }
      }
    } else {
      title.textContent = "Log New Item";
      document.getElementById("item-date").value = new Date()
        .toISOString()
        .split("T")[0];
    }

    modal.classList.add("active");
  }

  async function handleItemFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    const originalText = btn.textContent;

    btn.disabled = true;
    btn.innerHTML = '<span class="btn__spinner"></span> Saving...';

    try {
      const data = {
        title: document.getElementById("item-title").value.trim(),
        description: document.getElementById("item-description").value.trim(),
        category: document.getElementById("item-category").value,
        location_found: document.getElementById("item-location").value,
        date_found: (() => {
          const dateVal = document.getElementById("item-date").value;
          const parsed = dateVal ? new Date(dateVal) : new Date();
          return firebase.firestore.Timestamp.fromDate(
            isNaN(parsed.getTime()) ? new Date() : parsed
          );
        })(),
        status:
          document.getElementById("item-status-field").value || "available",
        uploaded_by: auth.currentUser.email,
      };

      const imageInput = document.getElementById("item-image");
      if (imageInput && imageInput.files.length > 0) {
        data.image_url = await StorageHelper.uploadImage(
          imageInput.files[0],
          "items",
        );
      } else if (editingItemId) {
        const existing = adminItems.find((i) => i.id === editingItemId);
        if (existing?.image_url) data.image_url = existing.image_url;
      }

      if (editingItemId) {
        await ItemsDB.update(editingItemId, data);
        Toast.success("Updated!", "Item has been updated.");
      } else {
        await ItemsDB.add(data);
        Toast.success("Added!", "New item has been posted.");
      }

      closeAllModals();
      if (currentView === "items") await loadAdminItems();
      else if (currentView === "dashboard") await loadDashboard();
    } catch (err) {
      console.error("Save error:", err);
      Toast.error("Error", "Failed to save item.");
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // ============================================
  // CLAIMS MANAGEMENT
  // ============================================

  async function loadAdminClaims() {
    const tableBody = document.getElementById("claims-table-body");
    const emptyState = document.getElementById("claims-empty-admin");
    if (!tableBody) return;

    tableBody.innerHTML =
      '<tr><td colspan="6" class="adm-table-empty">Loading claims...</td></tr>';

    try {
      adminClaims = await ClaimsDB.getAll();

      const itemTitles = {};
      const itemIds = [...new Set(adminClaims.map((c) => c.item_id).filter(id => id))];
      const items = await Promise.all(
        itemIds.map((id) =>
          ItemsDB.getById(id)
            .then((item) => (item ? item.title : "Deleted Item"))
            .catch(() => "Unknown")
        )
      );
      itemIds.forEach((id, index) => {
        itemTitles[id] = items[index];
      });

      if (adminClaims.length === 0) {
        tableBody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");

      tableBody.innerHTML = adminClaims
        .map(
          (claim) => `
        <tr>
          <td>
            <strong>${Utils.escapeHtml(claim.student_name)}</strong><br>
            <small style="color:var(--adm-outline)">${Utils.escapeHtml(claim.student_email)}</small>
          </td>
          <td>${Utils.escapeHtml(itemTitles[claim.item_id] || "Unknown")}</td>
          <td>${Utils.escapeHtml(claim.student_phone || "—")}</td>
          <td>${Utils.timeAgo(claim.created_at)}</td>
          <td><span class="adm-badge adm-badge--${claim.status || "pending"}">${claim.status || "pending"}</span></td>
          <td>
            <div class="adm-table__actions">
              <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.viewClaim('${claim.id}')" title="View">
                <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
              </button>
              ${
                claim.status === "pending"
                  ? `
                <button class="adm-btn adm-btn--success adm-btn--sm" onclick="AdminActions.approveClaim('${claim.id}')" title="Approve">
                  <span class="material-symbols-outlined" style="font-size:16px">check</span>
                </button>
                <button class="adm-btn adm-btn--danger-outline adm-btn--sm" onclick="AdminActions.rejectClaim('${claim.id}')" title="Reject">
                  <span class="material-symbols-outlined" style="font-size:16px">close</span>
                </button>
              `
                  : ""
              }
            </div>
          </td>
        </tr>
      `,
        )
        .join("");
    } catch (err) {
      console.error("Failed to load claims:", err);
      const errMessage = err.code === "permission-denied"
        ? "Access Denied: You do not have permission to view claims."
        : "Failed to load claims.";
      Toast.error("Error", errMessage);
      tableBody.innerHTML = `<tr><td colspan="6" class="adm-table-empty" style="color:var(--danger)">${errMessage}</td></tr>`;
      if (err.code === "permission-denied") {
        AuthHelper.logout();
      }
    }
  }

  function openClaimModal(claimId) {
    const claim = adminClaims.find((c) => c.id === claimId);
    if (!claim) return;

    const modal = document.getElementById("claim-modal");
    const content = document.getElementById("claim-detail-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="claim-detail">
        <div class="claim-detail__row"><div class="claim-detail__label">Student Name</div><div class="claim-detail__value">${Utils.escapeHtml(claim.student_name)}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Email</div><div class="claim-detail__value"><a href="mailto:${Utils.escapeHtml(claim.student_email)}">${Utils.escapeHtml(claim.student_email)}</a></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Phone</div><div class="claim-detail__value"><a href="tel:${Utils.escapeHtml(claim.student_phone)}">${Utils.escapeHtml(claim.student_phone || "—")}</a></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Status</div><div class="claim-detail__value"><span class="adm-badge adm-badge--${claim.status || "pending"}">${claim.status || "pending"}</span></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Submitted</div><div class="claim-detail__value">${Utils.formatDate(claim.created_at)}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Proof</div><div class="claim-detail__value">${Utils.escapeHtml(claim.proof_description || "No description provided.")}</div></div>
        ${claim.proof_image ? `<div class="claim-detail__row"><div class="claim-detail__label">Proof Image</div><div class="claim-detail__value"><img src="${claim.proof_image}" alt="Proof" style="max-width:300px;border-radius:10px;margin-top:6px"></div></div>` : ""}
      </div>
    `;

    const actionsEl = document.getElementById("claim-detail-actions");
    if (actionsEl) {
      if (claim.status === "pending") {
        actionsEl.innerHTML = `
          <button class="adm-btn adm-btn--success" onclick="AdminActions.approveClaim('${claim.id}')">
            <span class="material-symbols-outlined" style="font-size:18px">check</span> Approve Claim
          </button>
          <button class="adm-btn adm-btn--danger-outline" onclick="AdminActions.rejectClaim('${claim.id}')">
            <span class="material-symbols-outlined" style="font-size:18px">close</span> Reject
          </button>
        `;
      } else {
        actionsEl.innerHTML = `<span style="color:var(--adm-outline);font-size:14px">This claim has been ${claim.status}.</span>`;
      }
    }

    modal.classList.add("active");
  }

  // ============================================
  // LOST REPORTS MANAGEMENT
  // ============================================

  async function loadAdminReports() {
    const tableBody = document.getElementById("reports-table-body");
    const emptyState = document.getElementById("reports-empty-admin");
    if (!tableBody) return;

    tableBody.innerHTML =
      '<tr><td colspan="6" class="adm-table-empty">Loading reports...</td></tr>';

    try {
      adminReports = await LostReportsDB.getAll();

      if (adminReports.length === 0) {
        tableBody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
      }

      if (emptyState) emptyState.classList.add("hidden");

      tableBody.innerHTML = adminReports
        .map(
          (report) => `
        <tr>
          <td>
            <strong>${Utils.escapeHtml(report.student_name)}</strong><br>
            <small style="color:var(--adm-outline)">${Utils.escapeHtml(report.student_email)}</small>
          </td>
          <td>
            <strong>${Utils.escapeHtml(report.item_title)}</strong><br>
            <small style="color:var(--adm-outline)">${Utils.escapeHtml(report.category || "")}</small>
          </td>
          <td>${Utils.escapeHtml(report.last_seen_location || "—")}</td>
          <td>${Utils.formatDate(report.date_lost)}</td>
          <td><span class="adm-badge adm-badge--${report.status || "open"}">${report.status || "open"}</span></td>
          <td>
            <div class="adm-table__actions">
              <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.viewReport('${report.id}')" title="View">
                <span class="material-symbols-outlined" style="font-size:16px">visibility</span>
              </button>
              ${
                report.status === "open"
                  ? `
                <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.findMatches('${report.id}')" title="Find Matches">
                  <span class="material-symbols-outlined" style="font-size:16px">search</span>
                </button>
                <button class="adm-btn adm-btn--success adm-btn--sm" onclick="AdminActions.markReportMatched('${report.id}')" title="Mark Matched">
                  <span class="material-symbols-outlined" style="font-size:16px">check</span>
                </button>
                <button class="adm-btn adm-btn--outline adm-btn--sm" onclick="AdminActions.closeReport('${report.id}')" title="Close">
                  <span class="material-symbols-outlined" style="font-size:16px">close</span>
                </button>
              `
                  : ""
              }
            </div>
          </td>
        </tr>
      `,
        )
        .join("");
    } catch (err) {
      console.error("Failed to load reports:", err);
      const errMessage = err.code === "permission-denied"
        ? "Access Denied: You do not have permission to view lost reports."
        : "Failed to load lost reports.";
      Toast.error("Error", errMessage);
      tableBody.innerHTML = `<tr><td colspan="6" class="adm-table-empty" style="color:var(--danger)">${errMessage}</td></tr>`;
      if (err.code === "permission-denied") {
        AuthHelper.logout();
      }
    }
  }

  function openReportModal(reportId) {
    const report = adminReports.find((r) => r.id === reportId);
    if (!report) return;

    const modal = document.getElementById("report-modal");
    const content = document.getElementById("report-detail-content");
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="claim-detail">
        <div class="claim-detail__row"><div class="claim-detail__label">Student</div><div class="claim-detail__value">${Utils.escapeHtml(report.student_name)}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Email</div><div class="claim-detail__value"><a href="mailto:${Utils.escapeHtml(report.student_email)}">${Utils.escapeHtml(report.student_email)}</a></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Phone</div><div class="claim-detail__value"><a href="tel:${Utils.escapeHtml(report.student_phone)}">${Utils.escapeHtml(report.student_phone || "—")}</a></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Item</div><div class="claim-detail__value"><strong>${Utils.escapeHtml(report.item_title)}</strong></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Category</div><div class="claim-detail__value">${Utils.escapeHtml(report.category || "—")}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Last Seen</div><div class="claim-detail__value">${Utils.escapeHtml(report.last_seen_location || "—")}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Date Lost</div><div class="claim-detail__value">${Utils.formatDate(report.date_lost)}</div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Status</div><div class="claim-detail__value"><span class="adm-badge adm-badge--${report.status || "open"}">${report.status || "open"}</span></div></div>
        <div class="claim-detail__row"><div class="claim-detail__label">Description</div><div class="claim-detail__value">${Utils.escapeHtml(report.description || "No description.")}</div></div>
        ${report.image_url ? `<div class="claim-detail__row"><div class="claim-detail__label">Photo</div><div class="claim-detail__value"><img src="${report.image_url}" alt="Lost item" style="max-width:300px;border-radius:10px;margin-top:6px"></div></div>` : ""}
      </div>
    `;

    const actionsEl = document.getElementById("report-detail-actions");
    if (actionsEl) {
      if (report.status === "open") {
        actionsEl.innerHTML = `
          <button class="adm-btn adm-btn--outline" onclick="AdminActions.findMatches('${report.id}')">
            <span class="material-symbols-outlined" style="font-size:18px">search</span> Find Matches
          </button>
          <button class="adm-btn adm-btn--success" onclick="AdminActions.markReportMatched('${report.id}')">
            <span class="material-symbols-outlined" style="font-size:18px">check</span> Mark Matched
          </button>
          <button class="adm-btn adm-btn--outline" onclick="AdminActions.closeReport('${report.id}')">
            <span class="material-symbols-outlined" style="font-size:18px">close</span> Close Report
          </button>
        `;
      } else {
        actionsEl.innerHTML = `<span style="color:var(--adm-outline);font-size:14px">This report has been ${report.status}.</span>`;
      }
    }

    modal.classList.add("active");
  }

  // ============================================
  // Close Modals
  // ============================================

  function closeAllModals() {
    $$(".modal-overlay").forEach((m) => m.classList.remove("active"));
    editingItemId = null;
  }

  // ============================================
  // Global Actions
  // ============================================

  window.AdminActions = {
    editItem(id) {
      openItemModal(id);
    },

    async deleteItem(id) {
      if (!confirm("Delete this item? This cannot be undone.")) return;
      try {
        await ItemsDB.delete(id);
        Toast.success("Deleted", "Item removed.");
        if (currentView === "items") await loadAdminItems();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to delete item.");
      }
    },

    async markReturned(id) {
      if (!confirm("Mark as returned?")) return;
      try {
        await ItemsDB.update(id, { status: "returned" });
        Toast.success("Updated", "Item marked as returned.");
        if (currentView === "items") await loadAdminItems();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to update.");
      }
    },

    viewClaim(id) {
      openClaimModal(id);
    },

    async approveClaim(id) {
      if (!confirm("Approve this claim?")) return;
      try {
        const claim = adminClaims.find((c) => c.id === id);
        await ClaimsDB.updateStatus(id, "approved");
        if (claim?.item_id)
          await ItemsDB.update(claim.item_id, { status: "claimed" });
        Toast.success("Approved", "Claim approved.");
        closeAllModals();
        if (currentView === "claims") await loadAdminClaims();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to approve.");
      }
    },

    async rejectClaim(id) {
      if (!confirm("Reject this claim?")) return;
      try {
        await ClaimsDB.updateStatus(id, "rejected");
        Toast.success("Rejected", "Claim rejected.");
        closeAllModals();
        if (currentView === "claims") await loadAdminClaims();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to reject.");
      }
    },

    viewReport(id) {
      openReportModal(id);
    },

    async findMatches(id) {
      const report = adminReports.find((r) => r.id === id);
      if (!report) return;

      const matches = adminItems.filter(
        (i) =>
          i.status === "available" &&
          (i.category === report.category || !report.category),
      );

      const modal = document.getElementById("report-modal");
      const title = document.getElementById("report-detail-title");
      const content = document.getElementById("report-detail-content");
      const actions = document.getElementById("report-detail-actions");

      title.textContent = `Potential Matches for "${report.item_title}"`;

      if (matches.length === 0) {
        content.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--adm-text-sec)">No available items match this report's category.</div>`;
      } else {
        let html = `<div style="display:flex;flex-direction:column;gap:12px;max-height:400px;overflow-y:auto;padding-right:8px;">`;
        matches.forEach((m) => {
          html += `
            <div style="border: 1px solid var(--adm-outline-variant); border-radius: 8px; padding: 12px; display: flex; gap: 12px; align-items: center;">
              ${m.image_url ? `<img src="${m.image_url}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 4px;">` : `<div style="width: 48px; height: 48px; background: var(--adm-surface-variant); border-radius: 4px; display: flex; align-items: center; justify-content: center;"><span class="material-symbols-outlined" style="color:var(--adm-text-sec)">package</span></div>`}
              <div style="flex: 1;">
                <div style="font-weight: 600; font-size: 0.95rem; color: var(--adm-text); margin-bottom: 4px;">${Utils.escapeHtml(m.title)}</div>
                <div style="font-size: 0.8rem; color: var(--adm-text-sec);">
                  Found at ${Utils.escapeHtml(m.location_found)} on ${Utils.formatDate(m.date_found)}
                </div>
              </div>
              <a href="item.html?id=${m.id}" target="_blank" class="adm-btn adm-btn--outline adm-btn--sm" style="text-decoration:none;">View Item</a>
            </div>
          `;
        });
        html += `</div>`;
        content.innerHTML = html;
      }

      actions.innerHTML = `
        <button class="adm-btn adm-btn--outline" onclick="document.getElementById('report-modal').classList.remove('active')">Close</button>
      `;

      modal.classList.add("active");
    },

    async markReportMatched(id) {
      if (!confirm("Mark as matched?")) return;
      try {
        await LostReportsDB.updateStatus(id, "matched");
        Toast.success("Matched", "Report marked as matched.");
        closeAllModals();
        if (currentView === "reports") await loadAdminReports();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to update.");
      }
    },

    async closeReport(id) {
      if (!confirm("Close this report?")) return;
      try {
        await LostReportsDB.updateStatus(id, "closed");
        Toast.success("Closed", "Report closed.");
        closeAllModals();
        if (currentView === "reports") await loadAdminReports();
        else await loadDashboard();
      } catch (err) {
        Toast.error("Error", "Failed to close.");
      }
    },
  };

  // Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAllModals();
  });
})();
