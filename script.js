const API_KEY = '78deb1e2'; 

let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

// --- INITIALIZATION ---
// 1. Load Background
const savedBg = localStorage.getItem('cineTrackBg');
if(savedBg) document.body.style.backgroundImage = `url(${savedBg})`;

// 2. Load Accent Color
const savedColor = localStorage.getItem('cineTrackColor');
if(savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.getElementById('color-picker').value = savedColor;
}

// 3. Load Glass Mode
const isGlass = localStorage.getItem('cineTrackGlass') === 'true';
if(isGlass) {
    document.body.classList.add('glass-theme');
    document.getElementById('glass-toggle').checked = true;
}

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const tvFields = document.getElementById('tv-fields');
const libraryView = document.getElementById('library-view');
const settingsView = document.getElementById('settings-view');
const filterButtons = document.querySelectorAll('.filter-btn');

renderMedia('all');

// --- TAB NAVIGATION ---
window.switchTab = function(tabName) {
    if(tabName === 'settings') {
        libraryView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    } else {
        settingsView.classList.add('hidden');
        libraryView.classList.remove('hidden');
    }
}

// --- THEME SETTINGS ---
window.toggleGlassMode = function(isEnabled) {
    if(isEnabled) {
        document.body.classList.add('glass-theme');
        localStorage.setItem('cineTrackGlass', 'true');
    } else {
        document.body.classList.remove('glass-theme');
        localStorage.setItem('cineTrackGlass', 'false');
    }
}

window.updateAccentColor = function(color) {
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('cineTrackColor', color);
}

window.resetTheme = function() {
    if(confirm("Reset all visual settings?")) {
        localStorage.removeItem('cineTrackBg');
        localStorage.removeItem('cineTrackColor');
        localStorage.removeItem('cineTrackGlass');
        location.reload();
    }
}

window.uploadBackground = function(input) {
    const file = input.files[0];
    if(!file) return;
    if(file.size > 2 * 1024 * 1024) {
        alert("Image too large! Use < 2MB.");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        localStorage.setItem('cineTrackBg', e.target.result);
        document.body.style.backgroundImage = `url(${e.target.result})`;
    };
    reader.readAsDataURL(file);
}

// --- APP LOGIC ---
window.toggleTVFields = function() {
    const type = document.getElementById('type').value;
    if(type === 'TV Show') tvFields.classList.remove('hidden');
    else tvFields.classList.add('hidden');
}

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

function filterMovies(status) {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    // Simple check for the filter bar buttons
    const activeBtn = Array.from(filterButtons).find(b => 
        b.textContent.toLowerCase().replace(' ', '') === status || 
        (status === 'all' && b.textContent === 'All')
    );
    if(activeBtn) activeBtn.classList.add('active');
    renderMedia(status);
}

function saveAndRender() {
    localStorage.setItem('cineTrackData', JSON.stringify(mediaList));
    // Find active filter
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn ? activeBtn.textContent.toLowerCase().replace(' ', '') : 'all';
    renderMedia(filter === 'all' ? 'all' : filter);
}

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

function renderMedia(filter) {
    listContainer.innerHTML = '';
    const filteredList = mediaList.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    filteredList.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        
        let colorClass = '';
        if(item.status === 'towatch') colorClass = 'select-towatch';
        if(item.status === 'watching') colorClass = 'select-watching';
        if(item.status === 'seen') colorClass = 'select-seen';

        const isToWatch = item.status === 'towatch' ? 'selected' : '';
        const isWatching = item.status === 'watching' ? 'selected' : '';
        const isSeen = item.status === 'seen' ? 'selected' : '';

        let tvControls = '';
        if(item.type === 'TV Show') {
            tvControls = `
                <div class="tv-controls-container">
                    <div class="control-row">
                        <span style="font-size:0.8rem; color:#aaa;">Seas</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'season', -1)">-</button>
                        <span>${item.season || 1}</span>
                        <button class="ep-btn" onclick="updateTvProgress(${item.id}, 'season', 1)">+</button>
                    </div>
                    <div class="control-row">
                        <span style="font-size:0.8rem; color:#aaa;">Ep</span>
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
