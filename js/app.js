// ============================================
// NIET Lost & Found — Public App Logic
// ============================================

(function () {
  "use strict";

  // ============================================
  // SVG Icons (inline to avoid icon library deps)
  // ============================================
  const Icons = {
    search:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    mapPin:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    calendar:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    package:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    arrowLeft:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    upload:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    claim:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
  };

  // ============================================
  // State
  // ============================================

  let allItems = [];
  let filteredItems = [];
  let currentFilters = {
    category: "all",
    status: "all",
    date: "all",
    search: "",
  };

  // ============================================
  // DOM References (set after DOMContentLoaded)
  // ============================================

  let itemsGrid,
    searchInput,
    filterCategory,
    filterStatus,
    filterDate,
    clearFiltersBtn;
  let statsTotal, statsAvailable, statsClaimed, statsReturned;
  let loadingEl, emptyEl, itemsCountEl;

  // ============================================
  // Initialize
  // ============================================

  document.addEventListener("DOMContentLoaded", init);

  async function init() {
    // Cache DOM elements
    itemsGrid = document.getElementById("items-grid");
    searchInput = document.getElementById("search-input");
    filterCategory = document.getElementById("filter-category");
    filterStatus = document.getElementById("filter-status");
    filterDate = document.getElementById("filter-date");
    clearFiltersBtn = document.getElementById("clear-filters");
    statsTotal = document.getElementById("stat-total");
    statsAvailable = document.getElementById("stat-available");
    statsClaimed = document.getElementById("stat-claimed");
    statsReturned = document.getElementById("stat-returned");
    loadingEl = document.getElementById("items-loading");
    emptyEl = document.getElementById("items-empty");
    itemsCountEl = document.getElementById("items-count");

    // Initialize stats to 0 immediately
    if (statsTotal) statsTotal.textContent = "0";
    if (statsAvailable) statsAvailable.textContent = "0";
    if (statsClaimed) statsClaimed.textContent = "0";
    if (statsReturned) statsReturned.textContent = "0";

    // Populate filter options
    populateCategoryFilter();

    // Bind events
    bindEvents();

    // Setup mobile menu
    setupMobileMenu();

    // Setup theme toggle
    setupTheme();

    // Setup header scroll effect
    setupHeaderScroll();

    // Load data
    await loadItems();
    await loadStats();
  }

  // ============================================
  // Theme Toggle
  // ============================================

  function setupTheme() {
    const btn = document.getElementById("theme-toggle");
    if (!btn) return;

    const currentTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", currentTheme);

    btn.addEventListener("click", () => {
      const theme =
        document.documentElement.getAttribute("data-theme") === "dark"
          ? "light"
          : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
    });
  }

  // ============================================
  // Header Scroll Effect
  // ============================================

  function setupHeaderScroll() {
    const header = document.querySelector(".header");
    if (!header) return;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 20) {
        header.classList.add("header--scrolled");
      } else {
        header.classList.remove("header--scrolled");
      }
    });
  }

  // ============================================
  // Data Loading
  // ============================================

  async function loadItems() {
    showLoading(true);
    try {
      allItems = await ItemsDB.getAll();
      applyFilters();
    } catch (err) {
      console.error("Failed to load items:", err);
      // Ensure we still hide loading even on error
      if (itemsCountEl) itemsCountEl.textContent = "Error loading items";
    } finally {
      showLoading(false);
    }
  }

  async function loadStats() {
    try {
      const counts = await ItemsDB.getCounts(allItems);
      if (statsTotal) statsTotal.textContent = counts.total;
      if (statsAvailable) statsAvailable.textContent = counts.available;
      if (statsClaimed) statsClaimed.textContent = counts.claimed;
      if (statsReturned) statsReturned.textContent = counts.returned;
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }

  // ============================================
  // Filtering & Search
  // ============================================

  function populateCategoryFilter() {
    if (!filterCategory) return;
    Utils.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      filterCategory.appendChild(opt);
    });
  }

  function applyFilters() {
    filteredItems = [...allItems];

    // Category filter
    if (currentFilters.category !== "all") {
      filteredItems = filteredItems.filter(
        (i) => i.category === currentFilters.category,
      );
    }

    // Status filter
    if (currentFilters.status !== "all") {
      filteredItems = filteredItems.filter(
        (i) => i.status === currentFilters.status,
      );
    }

    // Date filter
    if (currentFilters.date !== "all") {
      const now = new Date();
      filteredItems = filteredItems.filter((i) => {
        const d = i.date_found?.toDate
          ? i.date_found.toDate()
          : new Date(i.date_found);
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        switch (currentFilters.date) {
          case "today":
            return diff < 1;
          case "week":
            return diff < 7;
          case "month":
            return diff < 30;
          default:
            return true;
        }
      });
    }

    // Search filter
    if (currentFilters.search) {
      const q = currentFilters.search.toLowerCase();
      filteredItems = filteredItems.filter(
        (i) =>
          i.title?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q) ||
          i.location_found?.toLowerCase().includes(q),
      );
    }

    renderItems();
  }

  // ============================================
  // Rendering
  // ============================================

  function renderItems() {
    if (!itemsGrid) return;

    // Update count
    if (itemsCountEl) {
      itemsCountEl.textContent = `${filteredItems.length} item${filteredItems.length !== 1 ? "s" : ""} found`;
    }

    // Show empty state if no items
    if (emptyEl) {
      emptyEl.classList.toggle("hidden", filteredItems.length > 0);
    }

    // Clear grid
    itemsGrid.innerHTML = "";

    if (filteredItems.length === 0) return;

    // Render cards
    filteredItems.forEach((item, index) => {
      const card = createItemCard(item, index);
      itemsGrid.appendChild(card);
    });

    // Observe for scroll animations
    observeCards();
  }

  function createItemCard(item, index) {
    const card = document.createElement("a");
    card.href = `item.html?id=${item.id}`;
    card.className = "item-card";
    card.setAttribute("data-aos", "fade-up");
    card.setAttribute("data-aos-delay", (index % 4) * 100);
    card.setAttribute("data-item-id", item.id);

    const statusClass = `item-card__status--${item.status || "available"}`;
    const dateStr = Utils.formatDate(item.date_found);

    card.innerHTML = `
      <div class="item-card__img-wrap">
        ${
          item.image_url
            ? `<img class="item-card__img" src="${item.image_url}" alt="${Utils.escapeHtml(item.title)}" loading="lazy">`
            : `<div class="item-card__img-placeholder">${Icons.package}</div>`
        }
        <span class="item-card__status ${statusClass}">${item.status || "available"}</span>
      </div>
      <div class="item-card__body">
        <div class="item-card__category">${Utils.escapeHtml(item.category || "Uncategorized")}</div>
        <h3 class="item-card__title">${Utils.escapeHtml(item.title)}</h3>
        <div class="item-card__meta">
          <span class="item-card__meta-item">
            ${Icons.mapPin}
            ${Utils.escapeHtml(item.location_found || "Unknown")}
          </span>
          <span class="item-card__meta-item">
            ${Icons.calendar}
            ${dateStr}
          </span>
        </div>
      </div>
    `;

    return card;
  }

  // ============================================
  // Intersection Observer (Scroll Animations)
  // ============================================

  let observer;

  function observeCards() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -40px 0px",
      },
    );

    document.querySelectorAll(".item-card").forEach((card) => {
      observer.observe(card);
    });
  }

  // ============================================
  // Event Bindings
  // ============================================

  function bindEvents() {
    // Search
    if (searchInput) {
      const heroSearch = document.getElementById("hero-search");
      const handler = Utils.debounce((val) => {
        currentFilters.search = val;
        applyFilters();
      }, 250);

      searchInput.addEventListener("input", (e) => handler(e.target.value));
      if (heroSearch) {
        heroSearch.addEventListener("input", (e) => {
          searchInput.value = e.target.value;
          handler(e.target.value);
        });
      }
    }

    // Filters
    if (filterCategory) {
      filterCategory.addEventListener("change", (e) => {
        currentFilters.category = e.target.value;
        applyFilters();
      });
    }
    if (filterStatus) {
      filterStatus.addEventListener("change", (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
      });
    }
    if (filterDate) {
      filterDate.addEventListener("change", (e) => {
        currentFilters.date = e.target.value;
        applyFilters();
      });
    }

    // Clear filters
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => {
        currentFilters = {
          category: "all",
          status: "all",
          date: "all",
          search: "",
        };
        if (filterCategory) filterCategory.value = "all";
        if (filterStatus) filterStatus.value = "all";
        if (filterDate) filterDate.value = "all";
        if (searchInput) searchInput.value = "";
        const heroSearch = document.getElementById("hero-search");
        if (heroSearch) heroSearch.value = "";
        applyFilters();
      });
    }
  }

  // ============================================
  // Mobile Menu
  // ============================================

  function setupMobileMenu() {
    const btn = document.getElementById("menu-toggle");
    const nav = document.getElementById("header-nav");
    if (!btn || !nav) return;

    // Create overlay if it doesn't exist
    let overlay = document.querySelector(".nav-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "nav-overlay";
      document.body.appendChild(overlay);
    }

    function toggleMenu(force) {
      const isOpen = typeof force === "boolean" ? force : !nav.classList.contains("active");
      nav.classList.toggle("active", isOpen);
      overlay.classList.toggle("active", isOpen);
      document.body.style.overflow = isOpen ? "hidden" : "";
      btn.innerHTML = isOpen ? Icons.close : Icons.menu;
    }

    btn.addEventListener("click", () => toggleMenu());
    overlay.addEventListener("click", () => toggleMenu(false));

    // Close on link click
    nav.querySelectorAll(".header__link").forEach((link) => {
      link.addEventListener("click", () => toggleMenu(false));
    });

    // Handle escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains("active")) {
        toggleMenu(false);
      }
    });

    // Clean up mobile state on resize
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 768 && nav.classList.contains("active")) {
        toggleMenu(false);
      }
    });
  }

  // ============================================
  // Loading State
  // ============================================

  function showLoading(show) {
    if (loadingEl) loadingEl.classList.toggle("hidden", !show);
    if (itemsGrid) itemsGrid.classList.toggle("hidden", show);
  }
})();
