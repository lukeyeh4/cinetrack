const API_KEY = '78deb1e2'; 

let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

// Load saved background on startup
const savedBg = localStorage.getItem('cineTrackBg');
if(savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
}

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const emptyState = document.getElementById('empty-state');
const navButtons = document.querySelectorAll('.nav-btn');
const tvFields = document.getElementById('tv-fields');

renderMedia('all');

// --- Background Image Logic ---
window.uploadBackground = function(input) {
    const file = input.files[0];
    if(!file) return;

    // Limit file size to 2MB to prevent LocalStorage crash
    if(file.size > 2 * 1024 * 1024) {
        alert("Image is too large! Please choose an image under 2MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const bgData = e.target.result;
        // Save to storage
        try {
            localStorage.setItem('cineTrackBg', bgData);
            document.body.style.backgroundImage = `url(${bgData})`;
        } catch (err) {
            alert("Storage full! Try a smaller image.");
        }
    };
    reader.readAsDataURL(file);
}

// --- Toggle Form Fields ---
window.toggleTVFields = function() {
    const type = document.getElementById('type').value;
    if(type === 'TV Show') {
        tvFields.classList.remove('hidden');
    } else {
        tvFields.classList.add('hidden');
    }
}

// --- Add Item ---
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;
    const dateWatched = document.getElementById('date-watched').value; 
    const notes = document.getElementById('notes').value; 
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
        dateWatched, notes, season, episode
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
    toggleTVFields();
});

// --- Navigation ---
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

// --- Update Logic ---
window.updateStatus = function(id, newStatus) {
    const item = mediaList.find(i => i.id === id);
    if(item) {
        item.status = newStatus;
        saveAndRender();
    }
}

window.updateTvProgress = function(id, field, change) {
    const item = mediaList.find(i => i.id === id);
    if(item) {
        let currentVal = parseInt(item[field]) || 1;
        let newVal = currentVal + change;
        if(newVal < 1) newVal = 1;
        
        item[field] = newVal;
        saveAndRender();
    }
}

// --- Render Logic ---
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
        
        // Determine Color Class
        let colorClass = '';
        if(item.status === 'towatch') colorClass = 'select-towatch';
        if(item.status === 'watching') colorClass = 'select-watching';
        if(item.status === 'seen') colorClass = 'select-seen';

        const isToWatch = item.status === 'towatch' ? 'selected' : '';
        const isWatching = item.status === 'watching' ? 'selected' : '';
        const isSeen = item.status === 'seen' ? 'selected' : '';

        // TV Controls
        let tvControls = '';
        if(item.type === 'TV Show') {
            tvControls = `
                <div class="tv-controls-container">
                    <div class="control-row">
                        <span class="control-label">Seas:</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'season', -1)">-</button>
                        <span>${item.season || 1}</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'season', 1)">+</button>
                    </div>
                    <div class="control-row">
                        <span class="control-label">Ep:</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'episode', -1)">-</button>
                        <span>${item.episode || 1}</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'episode', 1)">+</button>
                    </div>
                </div>
            `;
        }

        card.innerHTML = `
            <button class="delete-btn" onclick="deleteItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
            <img src="${item.poster}" class="card-poster" alt="${item.title}">
            
            <div class="card-meta">
                <span>${item.type}</span>
                <select class="card-status-select ${colorClass}" onchange="updateStatus(${item.id}, this.value)">
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
