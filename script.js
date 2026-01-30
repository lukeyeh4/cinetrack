const API_KEY = '78deb1e2'; 

let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const emptyState = document.getElementById('empty-state');
const navButtons = document.querySelectorAll('.nav-btn');
const tvFields = document.getElementById('tv-fields');

renderMedia('all');

// 1. Toggle TV Fields in Form
window.toggleTVFields = function() {
    const type = document.getElementById('type').value;
    if(type === 'TV Show') {
        tvFields.classList.remove('hidden');
    } else {
        tvFields.classList.add('hidden');
    }
}

// 2. Add New Item
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;
    const dateWatched = document.getElementById('date-watched').value; 
    const notes = document.getElementById('notes').value; 
    
    // Capture TV Data
    const season = document.getElementById('season').value || 1;
    const episode = document.getElementById('episode').value || 1;

    let posterUrl = 'https://via.placeholder.com/300x450?text=No+Poster'; 

    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Poster && data.Poster !== 'N/A') posterUrl = data.Poster;
    } catch (error) { console.error("Error fetching poster:", error); }

    const newItem = {
        id: Date.now(),
        title, type, status, rating, poster: posterUrl,
        dateWatched, notes,
        season, episode // Save TV Data
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
    toggleTVFields(); // Reset form visibility
});

function filterMovies(status) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    const activeBtn = Array.from(navButtons).find(b => 
        b.textContent.toLowerCase().replace(' ', '') === status || 
        (status === 'all' && b.textContent === 'All')
    );
    if(activeBtn) activeBtn.classList.add('active');
    renderMedia(status);
}

function saveAndRender() {
    localStorage.setItem('cineTrackData', JSON.stringify(mediaList));
    const activeFilter = document.querySelector('.nav-btn.active').textContent.toLowerCase().replace(' ', '');
    renderMedia(activeFilter === 'all' ? 'all' : activeFilter);
}

// 3. Update Status from Card
window.updateStatus = function(id, newStatus) {
    const item = mediaList.find(i => i.id === id);
    if(item) {
        item.status = newStatus;
        saveAndRender();
    }
}

// 4. Update Episode from Card
window.updateEpisode = function(id, change) {
    const item = mediaList.find(i => i.id === id);
    if(item) {
        // Ensure inputs are treated as numbers
        let currentEp = parseInt(item.episode) || 0;
        let newEp = currentEp + change;
        if(newEp < 0) newEp = 0; // Prevent negative episodes
        
        item.episode = newEp;
        saveAndRender();
    }
}

function renderMedia(filter) {
    listContainer.innerHTML = '';
    const filteredList = mediaList.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    if (filteredList.length === 0) emptyState.classList.remove('hidden');
    else emptyState.classList.add('hidden');

    filteredList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Status Dropdown Logic
        const isToWatch = item.status === 'towatch' ? 'selected' : '';
        const isWatching = item.status === 'watching' ? 'selected' : '';
        const isSeen = item.status === 'seen' ? 'selected' : '';

        // TV Show Logic (Episode Counter)
        let tvControls = '';
        if(item.type === 'TV Show') {
            tvControls = `
                <div class="episode-control">
                    <button class="ep-btn" onclick="updateEpisode(${item.id}, -1)">-</button>
                    <span>S${item.season || 1} : E${item.episode || 1}</span>
                    <button class="ep-btn" onclick="updateEpisode(${item.id}, 1)">+</button>
                </div>
            `;
        }

        card.innerHTML = `
            <img src="${item.poster}" class="card-poster" alt="${item.title}">
            <div class="card-meta">
                <span>${item.type}</span>
                
                <select class="card-status-select" onchange="updateStatus(${item.id}, this.value)">
                    <option value="towatch" ${isToWatch}>To Watch</option>
                    <option value="watching" ${isWatching}>Watching</option>
                    <option value="seen" ${isSeen}>Seen</option>
                </select>
            </div>
            
            <h3>${item.title}</h3>
            
            ${tvControls}

            ${item.rating ? `<div class="rating-display"><i class="fas fa-star"></i> ${item.rating}/10</div>` : ''}
            ${item.dateWatched ? `<span class="card-date"><i class="far fa-calendar-alt"></i> ${item.dateWatched}</span>` : ''}
            ${item.notes ? `<div class="card-notes">"${item.notes}"</div>` : ''}

            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        listContainer.appendChild(card);
    });
}

window.deleteItem = function(id) {
    if(confirm('Delete this title?')) {
        mediaList = mediaList.filter(item => item.id !== id);
        saveAndRender();
    }
}
