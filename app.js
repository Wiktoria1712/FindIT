const catalog = {
  "Nutella 350g": [
    {
      name: "ABC Grocery",
      chain: "Independent Store",
      distance: 0.4,
      price: 13.99,
      stock: 12,
      status: "good",
      eta: "3 min walk",
      reservation: true,
      district: "Old Town",
      x: 68,
      y: 38
    },
    {
      name: "Mark's Corner Shop",
      chain: "Independent Store",
      distance: 0.8,
      price: 12.49,
      stock: 4,
      status: "warn",
      eta: "5 min drive",
      reservation: true,
      district: "Old Town",
      x: 52,
      y: 54
    },
    {
      name: "Family Market by Anna",
      chain: "Neighborhood Market",
      distance: 1.1,
      price: 14.5,
      stock: 2,
      status: "warn",
      eta: "9 min walk",
      reservation: false,
      district: "Riverside",
      x: 31,
      y: 41
    },
    {
      name: "Green Basket",
      chain: "Organic Grocery",
      distance: 1.7,
      price: 11.99,
      stock: 19,
      status: "good",
      eta: "6 min drive",
      reservation: false,
      district: "Riverside",
      x: 24,
      y: 68
    },
    {
      name: "FreshMart Local",
      chain: "Independent Store",
      distance: 3.6,
      price: 12.99,
      stock: 0,
      status: "bad",
      eta: "11 min drive",
      reservation: false,
      district: "Garden District",
      x: 79,
      y: 73
    }
  ],
  "Pepsi Max 1.5L": [
    {
      name: "Mark's Corner Shop",
      chain: "Independent Store",
      distance: 0.8,
      price: 6.49,
      stock: 16,
      status: "good",
      eta: "5 min drive",
      reservation: true,
      district: "Old Town",
      x: 52,
      y: 54
    },
    {
      name: "ABC Grocery",
      chain: "Independent Store",
      distance: 0.4,
      price: 7.19,
      stock: 5,
      status: "warn",
      eta: "3 min walk",
      reservation: true,
      district: "Old Town",
      x: 68,
      y: 38
    },
    {
      name: "FreshMart Local",
      chain: "Independent Store",
      distance: 1.3,
      price: 5.99,
      stock: 24,
      status: "good",
      eta: "7 min drive",
      reservation: false,
      district: "Riverside",
      x: 45,
      y: 77
    },
    {
      name: "Family Market by Anna",
      chain: "Neighborhood Market",
      distance: 1.1,
      price: 7.49,
      stock: 0,
      status: "bad",
      eta: "9 min walk",
      reservation: false,
      district: "Riverside",
      x: 31,
      y: 41
    }
  ],
  "Fresh milk 1L": [
    {
      name: "ABC Grocery",
      chain: "Independent Store",
      distance: 0.4,
      price: 4.39,
      stock: 8,
      status: "good",
      eta: "3 min walk",
      reservation: true,
      district: "Old Town",
      x: 68,
      y: 38
    },
    {
      name: "Green Basket",
      chain: "Organic Grocery",
      distance: 1.7,
      price: 3.79,
      stock: 31,
      status: "good",
      eta: "6 min drive",
      reservation: false,
      district: "Riverside",
      x: 24,
      y: 68
    },
    {
      name: "Mark's Corner Shop",
      chain: "Independent Store",
      distance: 0.8,
      price: 4.15,
      stock: 3,
      status: "warn",
      eta: "5 min drive",
      reservation: true,
      district: "Old Town",
      x: 52,
      y: 54
    }
  ],
  "Coffee beans 1kg": [
    {
      name: "Green Basket",
      chain: "Organic Grocery",
      distance: 1.7,
      price: 42.99,
      stock: 14,
      status: "good",
      eta: "6 min drive",
      reservation: false,
      district: "Riverside",
      x: 24,
      y: 68
    },
    {
      name: "FreshMart Local",
      chain: "Independent Store",
      distance: 3.6,
      price: 39.99,
      stock: 6,
      status: "warn",
      eta: "11 min drive",
      reservation: false,
      district: "Garden District",
      x: 79,
      y: 73
    },
    {
      name: "Mark's Corner Shop",
      chain: "Independent Store",
      distance: 0.8,
      price: 46.99,
      stock: 0,
      status: "bad",
      eta: "5 min drive",
      reservation: true,
      district: "Old Town",
      x: 52,
      y: 54
    }
  ]
};

const statusMeta = {
  good: {
    label: "Available",
    note: "The product is in stock and ready to buy.",
    className: "status-good"
  },
  warn: {
    label: "Low stock",
    note: "Stock is limited. It is worth heading there soon.",
    className: "status-warn"
  },
  bad: {
    label: "Out of stock",
    note: "Currently unavailable in this store.",
    className: "status-bad"
  }
};

const productInput = document.querySelector("#product-input");
const radiusSelect = document.querySelector("#radius-select");
const sortSelect = document.querySelector("#sort-select");
const resultsList = document.querySelector("#results-list");
const resultsTitle = document.querySelector("#results-title");
const resultsSummary = document.querySelector("#results-summary");
const mapGrid = document.querySelector("#map-grid");
const quickTags = document.querySelector("#quick-tags");
const searchForm = document.querySelector("#search-form");

function getMatchingProduct(query) {
  const normalizedQuery = query.trim().toLowerCase();
  const productNames = Object.keys(catalog);

  if (!normalizedQuery) {
    return productNames[0];
  }

  return (
    productNames.find((name) => name.toLowerCase() === normalizedQuery) ||
    productNames.find((name) => name.toLowerCase().includes(normalizedQuery)) ||
    productNames[0]
  );
}

function getStatusWeight(status) {
  if (status === "good") return 0;
  if (status === "warn") return 1;
  return 2;
}

function formatPrice(price) {
  return `${price.toFixed(2).replace(".", ",")} PLN`;
}

function filterAndSortStores(productName) {
  const radius = Number(radiusSelect.value);
  const sortBy = sortSelect.value;

  const filtered = [...(catalog[productName] || [])].filter((store) => store.distance <= radius);

  filtered.sort((left, right) => {
    if (sortBy === "price") {
      return left.price - right.price;
    }

    if (sortBy === "availability") {
      return getStatusWeight(left.status) - getStatusWeight(right.status) || left.distance - right.distance;
    }

    return left.distance - right.distance;
  });

  return filtered;
}

function renderResults(productName) {
  const stores = filterAndSortStores(productName);
  const availableCount = stores.filter((store) => store.status === "good").length;
  resultsTitle.textContent = `Local stores with product: ${productName}`;
  resultsSummary.textContent = `${stores.length} stores in range - ${availableCount} available now`;

  if (!stores.length) {
    resultsList.innerHTML = `
      <div class="empty-state">
        <h3>No results in the selected radius</h3>
        <p>Increase the search radius or choose another product from the suggested tags above.</p>
      </div>
    `;
    mapGrid.innerHTML = "";
    return;
  }

  resultsList.innerHTML = stores
    .map((store) => {
      const meta = statusMeta[store.status];
      return `
        <article class="store-card">
          <div class="store-top">
            <div>
              <h3>${store.name}</h3>
              <div class="store-meta">
                <span>${store.chain}</span>
                <span>-</span>
                <span>${store.district}</span>
                <span>-</span>
                <span>${store.distance.toFixed(1).replace(".", ",")} km</span>
              </div>
            </div>
            <span class="store-pill ${meta.className}">${meta.label}</span>
          </div>

          <div class="store-stock">
            <span class="store-price">${formatPrice(store.price)}</span>
            <span class="stock-pill ${meta.className}">${store.stock > 0 ? `${store.stock} pcs` : "0 pcs"}</span>
            <span>${store.eta}</span>
          </div>

          <p class="availability-note">${meta.note}</p>

          <div class="store-actions">
            <a class="action-link" href="#map-grid">Navigate to store</a>
            <a class="action-link" href="#partners">Join as a partner store</a>
          </div>
        </article>
      `;
    })
    .join("");

  mapGrid.innerHTML = stores
    .map((store) => {
      const meta = statusMeta[store.status];
      return `
        <div class="map-pin" style="left:${store.x}%; top:${store.y}%;">
          <span class="pin-dot ${meta.className}"></span>
          <span class="pin-label">${store.chain} - ${meta.label}</span>
        </div>
      `;
    })
    .join("");
}

function syncActiveTag(productName) {
  const tags = quickTags.querySelectorAll(".tag");
  tags.forEach((tag) => {
    tag.classList.toggle("is-active", tag.dataset.product === productName);
  });
}

function runSearch(nextQuery) {
  const matchedProduct = getMatchingProduct(nextQuery ?? productInput.value);
  productInput.value = matchedProduct;
  syncActiveTag(matchedProduct);
  renderResults(matchedProduct);
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runSearch();
});

radiusSelect.addEventListener("change", () => runSearch());
sortSelect.addEventListener("change", () => runSearch());

quickTags.addEventListener("click", (event) => {
  const button = event.target.closest(".tag");
  if (!button) return;
  runSearch(button.dataset.product);
});

window.addEventListener("load", () => {
  runSearch(productInput.value);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("./service-worker.js");
      await registration.update();

      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload();
      });
    } catch (error) {
      console.error("Service worker registration failed:", error);
    }
  });
}
