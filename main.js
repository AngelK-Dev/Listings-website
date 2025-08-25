//For properties.json


// Global Application State
const AppState = {
    listings: [],
    filteredListings: [], // Fixed: was filteredHouses
    selectedListing: null, // Fixed: was selectedHouse
    showMap: false,
    showFilters: false,
    searchTerm: '',
    priceRange: [0, 2000000],
    bedroomFilter: null,
    bathroomFilter: null,
    loading: true,
    mapZoom: 1
};

// Load listings from JSON file 
// Load listings from JSON file 
async function loadListings() {
  try {
    const res = await fetch("./listings.json");
    if (!res.ok) throw new Error("Failed to load listings");

    const raw = await res.json();

    return (raw.listings || []).map((p, i) => {
      const original = p.priceHistory?.[0]?.price ?? p.currentPrice ?? 0;
      const current  = p.currentPrice ?? p.priceHistory?.[0]?.price ?? 0;

      // ✅ handle coords correctly
      let coords = null;
      if (Array.isArray(p.coords) && p.coords.length === 2) {
        coords = p.coords; // already [lat, lng]
      } else if (p.lat && p.lng) {
        coords = [p.lat, p.lng]; // build from lat/lng
      }

      // ✅ choose main image
      let mainImage = "/assets/no-image.png";
      if (p.imageUrls && p.imageUrls.length > 0) {
        const first = p.imageUrls[0];
        if (/^https?:\/\//i.test(first)) {
          mainImage = first; // full URL from JSON
        } else {
          mainImage = `/images/${first}.jpg`; // assume local file
        }
      }

      return {
        _id: p.id || String(i + 1),
        id: p.id || String(i + 1),
        sourceTable: p.sourceTable || "",
        address: p.address || "Unknown address",
        description: p.description || "",
        imageUrls: p.imageUrls || [],
        mainImage,
        homeType: p.homeType || "",
        status: p.status || "",
        direction: p.direction || "",
        original_price: original,
        new_price: current,
        price: current,
        bedrooms: p.bedrooms ?? null,
        bathrooms: p.bathrooms ?? null,
        coords,   // ✅ now always set if available
        lastUpdated: p.lastUpdated || "",
        priceHistory: p.priceHistory || []
      };
    });
  } catch (error) {
    console.error("Error loading listings:", error);    
    return [];
  }
}


const toggleBtn = document.getElementById("toggleBtn");
const mapContainer = document.getElementById("mapContainer");

//initialize map 
let map = L.map('map').setView([-1.83, -78.18],7);

//add tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

//initialize marker icons
let redIcon = L.icon({
    iconUrl: '/assets/red-marker.png',
    iconSize: [38, 38],
})

let greenIcon = L.icon({
    iconUrl: '/assets/green-marker.png',
    iconSize: [38, 38],
})



//loop and add markers
 function addMarkers(list) {
  list.forEach(({ coords, original_price, new_price: newPrice, address }) => {
    if (!coords) return; // skip if no coordinates

    const isIncreased = newPrice > original_price;
    const icon = isIncreased ? greenIcon : redIcon;
    const change = newPrice - original_price;
    const changePercent = ((change / original_price) * 100).toFixed(1);

    const popupContent = `
      <div style="font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 10px 0;">${address}</h4>
        <div><strong>Original:</strong> $${original_price.toLocaleString()}</div>
        <div><strong>New:</strong> $${newPrice.toLocaleString()}</div>
        <div style="color: ${isIncreased ? '#28a745' : '#dc3545'}; font-weight: bold;">
          ${isIncreased ? '+' : ''}$${change.toLocaleString()} (${changePercent}%)
        </div>
      </div>
    `;

    L.marker(coords, { icon })
      .addTo(map)
      .bindPopup(popupContent)
      .on("click", () => {
        const listing = list.find(l => l.coords?.[0] === coords[0] && l.coords?.[1] === coords[1]);
        if (listing) {
          updateState({ selectedListing: listing });
        }
      });
  });
}



toggleBtn.addEventListener("click", () => {
    if (mapContainer.style.display === 'none') {
        mapContainer.style.display = 'block';
        toggleBtn.textContent = 'Hide Map';
        requestAnimationFrame(() => map.invalidateSize());
    } else {
        mapContainer.style.display = 'none';
        toggleBtn.textContent = 'Show Map';
    }
});








    

// Property Card Generator
class PropertyCardGenerator {
    static formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    }

    static generateCard(listing) {
        const priceChange = listing.new_price - listing.original_price;
        const priceChangePercent = ((priceChange / listing.original_price) * 100).toFixed(1);
        const isIncrease = priceChange > 0;

         const images = listing.imageUrls && listing.imageUrls.length > 0
    ? listing.imageUrls.map((img, idx) => `
        <img 
          src="/images/${img}.jpg" 
          class="carousel-image ${idx === 0 ? 'active' : ''}" 
          alt="Image of ${listing.address}" 
          loading="lazy">
      `).join("")
    : `<img src="/assets/no-image.png" class="carousel-image active" alt="No image available">`;

        return `
          <div class="property-card" data-listing-id="${listing._id}">

                <div class="property-image carousel">
        <div class="carousel-container">
          ${images}
        </div>
        <button class="carousel-btn prev" data-listing-id="${listing._id}">❮</button>
        <button class="carousel-btn next" data-listing-id="${listing._id}">❯</button>


                    <div class="property-price-badge">${this.formatPrice(listing.new_price)}</div>
                    <button class="property-favorite" data-listing-id="${listing._id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                    <div class="property-features">
                        <div class="feature-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M2 4v16"></path>
                                <path d="M2 8h18a2 2 0 0 1 2 2v10"></path>
                                <path d="M2 17h20"></path>
                                <path d="M6 8v9"></path>
                            </svg>
                            ${listing.bedrooms}
                        </div>
                        <div class="feature-badge">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"></path>
                                <line x1="10" y1="5" x2="8" y2="7"></line>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <line x1="7" y1="19" x2="7" y2="21"></line>
                                <line x1="17" y1="19" x2="17" y2="21"></line>
                            </svg>
                            ${listing.bathrooms}
                        </div>
                    </div>
                </div>
                <div class="property-content">
                    <div class="property-address">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <h3>${listing.address}</h3>
                    </div>
                    <p class="property-description">${listing.description}</p>
                    <p class="property-meta" title="Type: ${listing.homeType} | Status: ${listing.status}">
                            <strong>Type:</strong> ${listing.homeType} <br>
                             <strong>Status:</strong> ${listing.status}
                    </p>
                    <div class="property-stats">
                        <div class="stat-box">
                            <div class="number">${listing.bedrooms}</div>
                            <div class="label">Bedrooms</div>
                        </div>
                        <div class="stat-box">
                            <div class="number">${listing.bathrooms}</div>
                            <div class="label">Bathrooms</div>
                        </div>
                    </div>
                    <button type="button" class="property-action  view-details" data-listing-id="${listing._id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View Details
                    </button>
                </div>
            </div>
        `;
    }
}


        // Create detail pages
function createDetailPages(list) {
  const container = document.getElementById('detail-pages');
  container.innerHTML = list.map(listing => {
    // Build carousel images
    const images = listing.imageUrls && listing.imageUrls.length > 0
      ? listing.imageUrls.map((img, idx) => `
          <img 
            src="/images/${img}.jpg" 
            class="carousel-image ${idx === 0 ? 'active' : ''}" 
            alt="Image of ${listing.address}" 
            loading="lazy">
        `).join("")
      : `<img src="/assets/no-image.png" class="carousel-image active" alt="No image available">`;

    return `
      <div class="detail-page" id="detail-${listing._id}">
        <div class="detail-header">
          <button type="button" class="back-button"> ← Back to Listings</button>

          <div class="carousel">
            <div class="carousel-container">
              ${images}
            </div>
            <button class="carousel-btn prev" data-listing-id="${listing._id}">❮</button>
            <button class="carousel-btn next" data-listing-id="${listing._id}">❯</button>
          </div>

          <div class="detail-price">$${listing.new_price.toLocaleString()}</div>
        </div>

        <div class="detail-content">
          <h1 class="detail-title">${listing.address}</h1>
          <p class="detail-description">${listing.description}</p>

          <div class="detail-specs">
            <div class="spec-item"><div class="spec-label">Bedrooms</div><div class="spec-value">${listing.bedrooms}</div></div>
            <div class="spec-item"><div class="spec-label">Bathrooms</div><div class="spec-value">${listing.bathrooms}</div></div>
            <div class="spec-item"><div class="spec-label">Type</div><div class="spec-value">${listing.homeType}</div></div>
            <div class="spec-item"><div class="spec-label">Status</div><div class="spec-value">${listing.status}</div></div>
            <div class="spec-item"><div class="spec-label">Direction</div><div class="spec-value">${listing.direction}</div></div>
            <div class="spec-item"><div class="spec-label">Last Updated</div><div class="spec-value">${listing.lastUpdated}</div></div>
          </div>

          <div class="contact-section">
            <h3>Interested in this property?</h3>
            <button class="contact-button">Contact Agent</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Back button
  container.onclick = (e) => {
    const back = e.target.closest('.back-button');
    if (back) {
      e.preventDefault();
      e.stopPropagation();
      showListings();
    }
  };

  // ✅ Enable carousels inside detail pages too
  initCarousels();
}


// Show detail page
function showDetail(id) {
    const propertyList = document.getElementById('property-list');
    if (propertyList) propertyList.style.display = 'none'; // hide listings wrapper

    document.querySelectorAll('.detail-page').forEach(page => {
        page.classList.remove('active');
    });

    const page = document.getElementById(`detail-${id}`);
    if (page) page.classList.add('active');

    document.body.classList.add('no-scroll'); // lock scroll
}


// Back to listings
function showListings() {
    document.querySelectorAll('.detail-page').forEach(page => {
        page.classList.remove('active');
    });

    const propertyList = document.getElementById('property-list');
    if (propertyList) propertyList.style.display = 'block'; // show wrapper again

    document.body.classList.remove('no-scroll'); // unlock scroll
}



// Filter Manager
class FilterManager {
    static applyFilters(listings, filters) {
        return listings.filter(listing => {
            const matchesSearch = !filters.searchTerm || 
                listing.address.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                listing.description.toLowerCase().includes(filters.searchTerm.toLowerCase());
            
            const price = listing.new_price ?? listing.original_price ?? 0;
            const matchesPrice = price >= filters.priceRange[0] && 
                price <= filters.priceRange[1];
            
            const matchesBedrooms = filters.bedroomFilter === null || 
                listing.bedrooms === filters.bedroomFilter;
            
            const matchesBathrooms = filters.bathroomFilter === null || 
                listing.bathrooms === filters.bathroomFilter;
            
            return matchesSearch && matchesPrice && matchesBedrooms && matchesBathrooms;
        });
    }

    static updatePriceDisplay(min, max) {
        const formatPrice = (price) => {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }).format(price);
        };

        const minDisplay = document.getElementById('price-min-display');
        const maxDisplay = document.getElementById('price-max-display');
        
        if (minDisplay) minDisplay.textContent = formatPrice(min);
        if (maxDisplay) maxDisplay.textContent = formatPrice(max);
    }
}

// State Management
function updateState(newState) {
    Object.assign(AppState, newState);
    renderApp();
}

// Main Render Function
function renderApp() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = AppState.loading ? 'flex' : 'none';
    }
    if (AppState.loading) return;

    // Apply filters
    AppState.filteredListings = FilterManager.applyFilters(AppState.listings, {
        searchTerm: AppState.searchTerm,
        priceRange: AppState.priceRange,
        bedroomFilter: AppState.bedroomFilter,
        bathroomFilter: AppState.bathroomFilter
    });

    updateHeroStats();
    updateResultsCount();

    const filtersSection = document.getElementById('filters-section');
    if (filtersSection) {
        filtersSection.classList.toggle('hidden', !AppState.showFilters);
    }

    const propertyList = document.getElementById('property-list');
    const noResults = document.getElementById('no-results');

    if (AppState.filteredListings.length === 0) {
        propertyList.classList.add('hidden');
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        propertyList.classList.remove('hidden');

        // Always reset pagination to first page when re-rendering
        currentPage = 1;
        renderPropertyList(currentPage, PAGE_SIZE);
    }

    // Keep selected/detail state in sync
    updateSelectedListing();
}



// Update hero statistics
function updateHeroStats() {
    const totalProperties = document.getElementById('total-properties');
    const minPrice = document.getElementById('min-price');
    const totalLocations = document.getElementById('total-locations');

    if (totalProperties) {
        totalProperties.textContent = AppState.listings.length;
    }

    if (minPrice && AppState.listings.length > 0) {
        const min = Math.min(...AppState.listings.map(l => l.new_price || 0));
        minPrice.textContent = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(min);
    }

    if (totalLocations && AppState.listings.length > 0) {
        const locations = new Set(AppState.listings.map(l =>
            l.address.split(',').pop()?.trim()
        ));
        totalLocations.textContent = locations.size;
    }
}

// Update results count
function updateResultsCount() {
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        const count = AppState.filteredListings.length;
        const propertyText = count === 1 ? 'property' : 'properties';
        resultsCount.textContent = `${count} ${propertyText} found`;
    }
}

// Pagination config
const PAGE_SIZE = 20;   // show 20 listings per page
let currentPage = 1;

// Render property list with pagination
function renderPropertyList(page = 1, pageSize = PAGE_SIZE) {
  const propertyGrid = document.getElementById('property-grid');
  if (!propertyGrid) return;

  const listings = AppState.filteredListings;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageListings = listings.slice(start, end);

  // Generate HTML for current page
  const cardsHTML = pageListings
    .map(listing => PropertyCardGenerator.generateCard(listing))
    .join('');

  propertyGrid.innerHTML = cardsHTML;

  // Attach events for the cards
  attachPropertyCardListeners();

  initCarousels();

  // Render pagination controls
  renderPaginationControls(listings.length, page, pageSize);
}

// Render pagination controls
function renderPaginationControls(total, page, pageSize) {
  const container = document.getElementById("pagination-controls");
  if (!container) return;

  const totalPages = Math.ceil(total / pageSize);

  container.innerHTML = `
    <button ${page === 1 ? "disabled" : ""} id="prev-page">Previous</button>
    <span> Page ${page} of ${totalPages} </span>
    <button ${page === totalPages ? "disabled" : ""} id="next-page">Next</button>
  `;

  document.getElementById("prev-page")?.addEventListener("click", () => {
    if (page > 1) {
      currentPage--;
      renderPropertyList(currentPage, PAGE_SIZE);

      //scroll to top of property list
      document.getElementById("content-section")
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.getElementById("next-page")?.addEventListener("click", () => {
    if (page < totalPages) {
      currentPage++;
      renderPropertyList(currentPage, PAGE_SIZE);

      //scroll to top of property list
        document.getElementById("content-section")
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });   
    }
  });
}


// Update selected property display
function updateSelectedListing() {
    const selectedPropertyContainer = document.getElementById('selected-property');
    const selectedPropertyContent = document.getElementById('selected-property-content');
    const propertyList = document.getElementById('property-list');

    if (!selectedPropertyContainer || !selectedPropertyContent) return;

    if (AppState.selectedListing) {
        // Show single property view
        selectedPropertyContainer.classList.remove('hidden');
        selectedPropertyContent.innerHTML = PropertyCardGenerator.generateCard(AppState.selectedListing);

        propertyList.classList.add('hidden'); // hide listings
        attachSelectedPropertyListeners();
    } else {
        // Back to listings
        selectedPropertyContainer.classList.add('hidden');
        propertyList.classList.remove('hidden');
    }
}




        
// Attach event listeners to property cards
function attachPropertyCardListeners() {
    const propertyGrid = document.getElementById('property-grid');
    if (!propertyGrid) return;

    // Add hover effects with CSS
    const style = document.createElement('style');
    style.textContent = `
        .property-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .property-favorite.favorited {
            background: #dc3545 !important;
            color: white !important;
        }
        .property-action:hover {
            background: #0056b3 !important;
        }
    `;
    if (!document.querySelector('style[data-property-styles]')) {
        style.setAttribute('data-property-styles', 'true');
        document.head.appendChild(style);
    }

    // Delegate clicks inside propertyGrid
    propertyGrid.addEventListener('click', (e) => {
        const favoriteBtn = e.target.closest('.property-favorite');
        const actionBtn = e.target.closest('.property-action');
        const card = e.target.closest('.property-card');

        if (favoriteBtn) {
            e.stopPropagation();
            favoriteBtn.classList.toggle('favorited');
            favoriteBtn.style.background = favoriteBtn.classList.contains('favorited') ? '#dc3545' : 'rgba(255,255,255,0.9)';
            favoriteBtn.style.color = favoriteBtn.classList.contains('favorited') ? 'white' : 'black';
        } else if (actionBtn) {
            e.stopPropagation();
            const listingId = actionBtn.dataset.listingId;
            showDetail(listingId);
        } 
        
    });
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            updateState({ searchTerm: e.target.value });
        });
    }

   

    // Filters toggle
    const filtersToggle = document.getElementById('filters-toggle');
    if (filtersToggle) {
        filtersToggle.addEventListener('click', () => {
            updateState({ showFilters: !AppState.showFilters });
        });
    }

    // Clear filters
    const clearFilters = document.getElementById('clear-filters');
    if (clearFilters) {
        clearFilters.addEventListener('click', () => {
            updateState({
                searchTerm: '',
                priceRange: [0, 2000000],
                bedroomFilter: null,
                bathroomFilter: null
            });

            // Reset UI elements
            if (searchInput) searchInput.value = '';
            resetFilterButtons();
            resetPriceSliders();
        });
    }

    // Price sliders
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');

    if (priceMin && priceMax) {
        const updatePriceRange = () => {
            const min = parseInt(priceMin.value);
            const max = parseInt(priceMax.value);

            if (min <= max) {
                updateState({ priceRange: [min, max] });
                FilterManager.updatePriceDisplay(min, max);
            }
        };

        priceMin.addEventListener('input', updatePriceRange);
        priceMax.addEventListener('input', updatePriceRange);
    }

    // Filter buttons
    setupFilterButtons('bedroom-filters', 'bedroomFilter');
    setupFilterButtons('bathroom-filters', 'bathroomFilter');

    // Close selected property
    const closeSelectedProperty = document.getElementById('close-selected-property');
    if (closeSelectedProperty) {
        closeSelectedProperty.addEventListener('click', () => {
            updateState({ selectedListing: null });
        });
    }
}

function initCarousels() {
  document.querySelectorAll('.property-card').forEach(card => {
    const images = card.querySelectorAll('.carousel-image');
    const prevBtn = card.querySelector('.carousel-btn.prev');
    const nextBtn = card.querySelector('.carousel-btn.next');

    if (!images.length) return;

    let current = 0;

    function showImage(index) {
      images.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
    }

    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      current = (current - 1 + images.length) % images.length;
      showImage(current);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      current = (current + 1) % images.length;
      showImage(current);
    });
  });
}


// Setup filter buttons
function setupFilterButtons(containerId, stateKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            // Remove active class from all buttons in this container
            container.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to clicked button
            e.target.classList.add('active');

            // Update state
            const value = e.target.dataset.value;
            updateState({
                [stateKey]: value === '' ? null : parseInt(value)
            });
        }
    });
}

// Reset filter buttons
function resetFilterButtons() {
    document.querySelectorAll('.filter-buttons').forEach(container => {
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Activate "Any" button
        const anyBtn = container.querySelector('[data-value=""]');
        if (anyBtn) anyBtn.classList.add('active');
    });
}

// Reset price sliders
function resetPriceSliders() {
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');

    if (priceMin) priceMin.value = '0';
    if (priceMax) priceMax.value = '2000000';

    FilterManager.updatePriceDisplay(0, 2000000);
}

// Initialize application
async function initApp() {
  try {
    setupEventListeners();

    // Load from JSON
    const listings = await loadListings();

    // Add price helper
    listings.forEach(l => l.price = l.new_price);

    const maxPrice = Math.max(...listings.map(l => l.price));

    updateState({
      listings,
      filteredListings: listings,
      loading: false,
      priceRange: [0, maxPrice]
    });

    const priceMax = document.getElementById('price-max');
    if (priceMax) {
      priceMax.max = maxPrice;
      priceMax.value = maxPrice;
    }

    FilterManager.updatePriceDisplay(0, maxPrice);

    createDetailPages(listings);

    // Render first page of properties
    currentPage = 1;
    renderPropertyList(currentPage, PAGE_SIZE);

    // Add map markers
    addMarkers(listings);

    // Auto fit map to show all markers
const bounds = L.latLngBounds([]);
listings.forEach(l => {
  if (l.coords) bounds.extend(l.coords);
});
if (bounds.isValid()) map.fitBounds(bounds);


  } catch (error) {
    console.error('Error loading listings:', error);
    updateState({ loading: false });
  }
}


// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
