// Retrieve data from local storage or initialize empty array
let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const emptyState = document.getElementById('empty-state');
const navButtons = document.querySelectorAll('.nav-btn');

// Initial Render
renderMedia('all');

// --- Event Listeners ---

// 1. Add New Item
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;

    const newItem = {
        id: Date.now(), // Unique ID based on timestamp
        title,
        type,
        status,
        rating
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
});

// 2. Filter Navigation
function filterMovies(status) {
    // Update active button styling
    navButtons.forEach(btn => btn.classList.remove('active'));
    // Find the button that was clicked (or corresponds to the status)
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

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
            <div class="card-meta">
                <span>${item.type}</span>
                <span class="card-badge ${statusClass}">${statusText}</span>
            </div>
            <h3>${item.title}</h3>
            ${item.rating ? `<div class="rating-display"><i class="fas fa-star"></i> ${item.rating}/10</div>` : ''}
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
