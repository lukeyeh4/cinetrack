const API_KEY = '78deb1e2'; // Your OMDb Key

// Retrieve data from local storage or initialize empty array
let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const emptyState = document.getElementById('empty-state');
const navButtons = document.querySelectorAll('.nav-btn');

// Initial Render
renderMedia('all');

// --- Event Listeners ---

// 1. Add New Item (with API Fetch)
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;

    // Default placeholder image
    let posterUrl = 'https://via.placeholder.com/300x450?text=No+Poster'; 

    // Fetch from OMDb API
    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
        const data = await res.json();
        
        // Check if API returned a valid poster
        if (data.Poster && data.Poster !== 'N/A') {
            posterUrl = data.Poster;
        }
    } catch (error) {
        console.error("Error fetching poster:", error);
    }

    const newItem = {
        id: Date.now(), // Unique ID based on timestamp
        title,
        type,
        status,
        rating,
        poster: posterUrl // Store the image URL
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
});

// 2. Filter Navigation
function filterMovies(status) {
    // Update active button styling
    navButtons.forEach(btn => btn.classList.remove('active'));
    // Find the button that was clicked
    const activeBtn = Array.from(navButtons).find(b => 
        b.textContent.toLowerCase().replace(' ', '') === status || 
        (status === 'all' && b.textContent === 'All')
    );
    if(activeBtn) activeBtn.classList.add('active');

    renderMedia(status);
}

// --- Core Functions ---

function saveAndRender() {
    localStorage.setItem('cineTrackData', JSON.stringify(mediaList));
    // Re-render based on currently active filter
    const activeFilter = document.querySelector('.nav-btn.active').textContent.toLowerCase().replace(' ', '');
    renderMedia(activeFilter === 'all' ? 'all' : activeFilter);
}

function renderMedia(filter) {
    listContainer.innerHTML = '';

    // Filter the list
    const filteredList = mediaList.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    // Toggle Empty State
    if (filteredList.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    // Generate Cards
    filteredList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Status Badge Logic
        let statusClass = '';
        let statusText = '';
        if(item.status === 'towatch') { statusClass = 'status-towatch'; statusText = 'To Watch'; }
        if(item.status === 'watching') { statusClass = 'status-watching'; statusText = 'Watching'; }
        if(item.status === 'seen') { statusClass = 'status-seen'; statusText = 'Seen'; }

        // Inject HTML
        card.innerHTML = `
            <img src="${item.poster}" class="card-poster" alt="${item.title}">
            <div class="card-meta">
                <span>${item.type}</span>
                <span class="card-badge ${statusClass}">${statusText}</span>
            </div>
            <h3>${item.title}</h3>
            ${item.rating ? `<div class="rating-display"><i class="fas fa-star"></i> ${item.rating}/10</div>` : ''}
            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;

        listContainer.appendChild(card);
    });
}

// Global function to delete item
window.deleteItem = function(id) {
    if(confirm('Delete this title?')) {
        mediaList = mediaList.filter(item => item.id !== id);
        saveAndRender();
    }
}
