const API_KEY = '78deb1e2'; 

// Load main data
let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

// --- DOM ELEMENTS ---
const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const tvFields = document.getElementById('tv-fields');
const libraryView = document.getElementById('library-view');
const settingsView = document.getElementById('settings-view');
const statsView = document.getElementById('stats-view');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit');

// Modal Elements
const modal = document.getElementById('episode-modal');
const modalBody = document.getElementById('modal-body');
const modalTitle = document.getElementById('modal-title');
let currentOpenId = null;

// --- TABS & NAV ---
window.switchTab = function(tabName) {
    libraryView.classList.add('hidden');
    settingsView.classList.add('hidden');
    statsView.classList.add('hidden');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active'); 

    if(tabName === 'library') libraryView.classList.remove('hidden');
    if(tabName === 'settings') settingsView.classList.remove('hidden');
    if(tabName === 'stats') {
        statsView.classList.remove('hidden');
        updateStats();
    }
}

// --- VIEW MODE TOGGLE ---
window.toggleViewMode = function(mode) {
    const gridBtn = document.getElementById('view-grid');
    const listBtn = document.getElementById('view-list');
    const container = document.getElementById('movie-list');

    if(!gridBtn || !listBtn) return;

    if(mode === 'list') {
        container.classList.add('list-mode');
        listBtn.classList.add('active');
        gridBtn.classList.remove('active');
    } else {
        container.classList.remove('list-mode');
        gridBtn.classList.add('active');
        listBtn.classList.remove('active');
    }
    localStorage.setItem('cineTrackViewMode', mode);
}

// --- STATS LOGIC ---
function updateStats() {
    document.getElementById('stat-total').innerText = mediaList.length;
    document.getElementById('stat-movies').innerText = mediaList.filter(i => i.type === 'Movie').length;
    document.getElementById('stat-shows').innerText = mediaList.filter(i => i.type === 'TV Show').length;
    
    let minutes = 0;
    mediaList.forEach(item => {
        if(item.type === 'Movie') {
            // Assume 120 mins per movie (or fetch runtime if we were advanced)
            minutes += 120;
        } else if(item.type === 'TV Show') {
            // If we are tracking episodes, count watched ones. Else use manual field.
            const eps = item.watchedEpisodes ? item.watchedEpisodes.length : (parseInt(item.episode || 1));
            minutes += (eps * 45); // Avg 45 mins per ep
        }
    });
    document.getElementById('stat-mins').innerText = minutes.toLocaleString();
}

// --- FORM HANDLING ---
window.toggleTVFields = function() {
    const type = document.getElementById('type').value;
    if(type === 'TV Show') tvFields.classList.remove('hidden');
    else tvFields.classList.add('hidden');
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const editId = document.getElementById('edit-id').value;
    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;
    const dateWatched = document.getElementById('date-watched').value; 
    const notes = document.getElementById('notes').value; 
    const season = document.getElementById('season').value || 1;
    const episode = document.getElementById('episode').value || 1;

    if(editId) {
        const index = mediaList.findIndex(i => i.id == editId);
        if(index > -1) {
            mediaList[index] = { ...mediaList[index], title, type, status, rating, dateWatched, notes, season, episode };
            saveAndRender();
            cancelEditMode();
        }
        return;
    }

    let posterUrl = 'https://via.placeholder.com/300x450?text=No+Poster'; 
    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Poster && data.Poster !== 'N/A') posterUrl = data.Poster;
    } catch (error) { console.error("Error:", error); }

    const newItem = {
        id: Date.now(),
        title, type, status, rating, poster: posterUrl,
        dateWatched, notes, season, episode,
        watchedEpisodes: [] // Initialize empty array for TV
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
    toggleTVFields();
});

window.startEdit = function(id) {
    const item = mediaList.find(i => i.id === id);
    if(!item) return;

    document.getElementById('edit-id').value = item.id;
    document.getElementById('title').value = item.title;
    document.getElementById('type').value = item.type;
    document.getElementById('status').value = item.status;
    document.getElementById('rating').value = item.rating || '';
    document.getElementById('date-watched').value = item.dateWatched || '';
    document.getElementById('notes').value = item.notes || '';
    document.getElementById('season').value = item.season || 1;
    document.getElementById('episode').value = item.episode || 1;

    toggleTVFields();
    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Item';
    cancelEditBtn.classList.remove('hidden');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.cancelEditMode = function() {
    form.reset();
    document.getElementById('edit-id').value = '';
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Library';
    cancelEditBtn.classList.add('hidden');
    toggleTVFields();
}

// --- SEARCH & FILTER ---
window.handleSearch = function() { renderMedia(); }

window.filterMovies = function(status) {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    const buttons = Array.from(document.querySelectorAll('.filter-btn'));
    const btn = buttons.find(b => b.textContent.toLowerCase().replace(' ','') === status || (status === 'all' && b.textContent === 'All'));
    if(btn) btn.classList.add('active');
    renderMedia();
}

function saveAndRender() {
    localStorage.setItem('cineTrackData', JSON.stringify(mediaList));
    renderMedia();
    updateStats();
}

function renderMedia() {
    listContainer.innerHTML = '';
    const activeBtn = document.querySelector('.filter-btn.active');
    const filter = activeBtn ? activeBtn.textContent.toLowerCase().replace(' ', '') : 'all';
    const search = document.getElementById('search-bar').value.toLowerCase();
    const hideSeen = document.getElementById('hide-seen-toggle').checked;

    const filteredList = mediaList.filter(item => {
        const matchesFilter = (filter === 'all') || (item.status === filter);
        const matchesSearch = item.title.toLowerCase().includes(search);
        const matchesHideSeen = hideSeen ? item.status !== 'seen' : true;
        return matchesFilter && matchesSearch && matchesHideSeen;
    });

    filteredList.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.draggable = true;
        
        // --- DRAG EVENTS ---
        card.addEventListener('dragstart', (e) => dragStart(e, index));
        card.addEventListener('dragover', (e) => dragOver(e));
        card.addEventListener('drop', (e) => drop(e, index));
        card.addEventListener('dragend', (e) => dragEnd(e)); 

        let colorClass = '';
        if(item.status === 'towatch') colorClass = 'select-towatch';
        if(item.status === 'watching') colorClass = 'select-watching';
        if(item.status === 'seen') colorClass = 'select-seen';

        const isToWatch = item.status === 'towatch' ? 'selected' : '';
        const isWatching = item.status === 'watching' ? 'selected' : '';
        const isSeen = item.status === 'seen' ? 'selected' : '';

        // TV CONTROL BUTTON
        let tvControls = '';
        if(item.type === 'TV Show') {
            const watchedCount = item.watchedEpisodes ? item.watchedEpisodes.length : 0;
            tvControls = `
                <div class="tv-controls-container">
                    <button class="glass-btn primary-glass" style="width:100%; font-size:0.8rem;" onclick="openEpisodeTracker(${item.id})">
                        <i class="fas fa-list-ul"></i> Episodes (${watchedCount})
                    </button>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="drag-handle"><i class="fas fa-grip-lines"></i></div>
            <div class="card-type-badge">${item.type}</div>
            <div class="card-actions">
                <button class="action-btn" onclick="startEdit(${item.id})"><i class="fas fa-pencil-alt"></i></button>
                <button class="action-btn delete-btn" onclick="deleteItem(${item.id})"><i class="fas fa-trash"></i></button>
            </div>
            <img src="${item.poster}" class="card-poster" alt="${item.title}">
            <div class="card-meta">
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

// --- DRAG LOGIC ---
let draggedItemIndex = null;

function dragStart(e, index) {
    draggedItemIndex = index;
    setTimeout(() => { e.target.classList.add('dragging'); }, 0);
}
function dragEnd(e) { e.target.classList.remove('dragging'); }
function dragOver(e) { e.preventDefault(); }
function drop(e, dropIndex) {
    e.preventDefault();
    const draggedItem = mediaList[draggedItemIndex];
    mediaList.splice(draggedItemIndex, 1);
    mediaList.splice(dropIndex, 0, draggedItem);
    saveAndRender();
}

// --- GLOBAL ACTIONS ---
window.deleteItem = function(id) {
    if(confirm('Delete this title?')) {
        mediaList = mediaList.filter(item => item.id !== id);
        saveAndRender();
    }
}
window.updateStatus = function(id, newStatus) {
    const item = mediaList.find(i => i.id === id);
    if(item) { item.status = newStatus; saveAndRender(); }
}

// --- EPISODE TRACKER (OPTIMIZED) ---
window.openEpisodeTracker = async function(id) {
    const item = mediaList.find(i => i.id === id);
    if(!item) return;

    currentOpenId = id;
    modal.classList.remove('hidden');
    modalTitle.innerText = item.title;
    modalBody.innerHTML = '<div class="loader"></div><p style="text-align:center">Loading episode guide...</p>';

    // Check Session Storage
    const sessionKey = `cineTrack_titles_${item.title}`;
    let episodeData = sessionStorage.getItem(sessionKey);

    if (episodeData) {
        renderEpisodeList(item, JSON.parse(episodeData));
    } else {
        await fetchAndCacheEpisodes(item, sessionKey);
    }
}

async function fetchAndCacheEpisodes(item, sessionKey) {
    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(item.title)}&apikey=${API_KEY}`);
        const data = await res.json();
        
        if(!data.totalSeasons) {
            modalBody.innerHTML = '<p>No episode data found.</p>';
            return;
        }

        const totalSeasons = parseInt(data.totalSeasons);
        let allSeasons = {};

        for(let s = 1; s <= totalSeasons; s++) {
            modalBody.innerHTML = `<div class="loader"></div><p style="text-align:center">Syncing Season ${s}/${totalSeasons}...</p>`;
            const seasonRes = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(item.title)}&Season=${s}&apikey=${API_KEY}`);
            const seasonData = await seasonRes.json();
            
            if(seasonData.Episodes) {
                allSeasons[s] = seasonData.Episodes.map(ep => ({
                    ep: ep.Episode,
                    title: ep.Title
                }));
            }
        }

        sessionStorage.setItem(sessionKey, JSON.stringify(allSeasons));
        renderEpisodeList(item, allSeasons);
    } catch (err) {
        console.error(err);
        modalBody.innerHTML = '<p>Error connecting to database.</p>';
    }
}

function renderEpisodeList(item, seasonData) {
    modalBody.innerHTML = '';
    if (!item.watchedEpisodes) item.watchedEpisodes = []; 

    Object.keys(seasonData).forEach(seasonNum => {
        const seasonDiv = document.createElement('div');
        seasonDiv.className = 'season-group';
        
        const headerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.5rem;">
                <span class="season-title" style="border:none; margin:0;">Season ${seasonNum}</span>
                <button class="glass-btn" style="font-size:0.7rem; padding:4px 8px;" onclick="markSeasonWatched(${item.id}, ${seasonNum}, ${seasonData[seasonNum].length})">
                    <i class="fas fa-check-double"></i> All
                </button>
            </div>
        `;
        seasonDiv.innerHTML = headerHtml;

        seasonData[seasonNum].forEach(ep => {
            const epId = `${seasonNum}-${ep.ep}`;
            const isWatched = item.watchedEpisodes.includes(epId);

            const epRow = document.createElement('div');
            epRow.className = `episode-item ${isWatched ? 'watched' : ''}`;
            epRow.onclick = () => toggleEpisode(item.id, epId);
            
            epRow.innerHTML = `
                <div class="ep-checkbox"></div>
                <div class="ep-number">E${ep.ep}</div>
                <span class="ep-title">${ep.title}</span>
            `;
            seasonDiv.appendChild(epRow);
        });

        modalBody.appendChild(seasonDiv);
    });
}

window.toggleEpisode = function(itemId, epId) {
    const item = mediaList.find(i => i.id === itemId);
    if(!item) return;
    if(!item.watchedEpisodes) item.watchedEpisodes = [];

    const index = item.watchedEpisodes.indexOf(epId);
    if (index > -1) item.watchedEpisodes.splice(index, 1);
    else item.watchedEpisodes.push(epId);

    saveAndRender();
    
    // Re-render
    const sessionKey = `cineTrack_titles_${item.title}`;
    const cachedData = JSON.parse(sessionStorage.getItem(sessionKey));
    if(cachedData) renderEpisodeList(item, cachedData);
}

window.markSeasonWatched = function(itemId, seasonNum, totalEpsInSeason) {
    const item = mediaList.find(i => i.id === itemId);
    if(!item) return;
    if(!item.watchedEpisodes) item.watchedEpisodes = [];

    for(let i = 1; i <= totalEpsInSeason; i++) {
        const epId = `${seasonNum}-${i}`;
        if(!item.watchedEpisodes.includes(epId)) {
            item.watchedEpisodes.push(epId);
        }
    }
    saveAndRender();
    
    const sessionKey = `cineTrack_titles_${item.title}`;
    const cachedData = JSON.parse(sessionStorage.getItem(sessionKey));
    if(cachedData) renderEpisodeList(item, cachedData);
}

window.closeModal = function() {
    modal.classList.add('hidden');
    currentOpenId = null;
}

// --- SETTINGS & INITIALIZATION ---
window.toggleGlassMode = function(checked) {
    document.body.classList.toggle('glass-theme', checked);
    localStorage.setItem('cineTrackGlass', checked);
}
window.updateAccentColor = function(color) {
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('cineTrackColor', color);
}
window.updateTextColor = function(color) {
    document.documentElement.style.setProperty('--text-main', color);
    localStorage.setItem('cineTrackTextColor', color);
}
window.resetTheme = function() {
    if(confirm("Reset theme?")) {
        localStorage.removeItem('cineTrackBg');
        localStorage.removeItem('cineTrackColor');
        localStorage.removeItem('cineTrackTextColor');
        localStorage.removeItem('cineTrackGlass');
        location.reload();
    }
}
window.uploadBackground = function(input) {
    const file = input.files[0];
    if(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            localStorage.setItem('cineTrackBg', e.target.result);
            document.getElementById('bg-layer').style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }
}

// Backup / Restore
window.downloadBackup = function() {
    const backupData = {
        mediaList: mediaList,
        preferences: {
            bg: localStorage.getItem('cineTrackBg'),
            color: localStorage.getItem('cineTrackColor'),
            textColor: localStorage.getItem('cineTrackTextColor'),
            glass: localStorage.getItem('cineTrackGlass')
        },
        exportDate: new Date().toISOString()
    };
    const dataStr = JSON.stringify(backupData, null, 2); 
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cinetrack_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.restoreBackup = function(input) {
    const file = input.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(!data.mediaList) { alert("Invalid backup file!"); return; }
            if(confirm(`Restore backup? This overwrites current data.`)) {
                mediaList = data.mediaList;
                localStorage.setItem('cineTrackData', JSON.stringify(mediaList));
                if(data.preferences) {
                    if(data.preferences.bg) localStorage.setItem('cineTrackBg', data.preferences.bg);
                    if(data.preferences.color) localStorage.setItem('cineTrackColor', data.preferences.color);
                    if(data.preferences.textColor) localStorage.setItem('cineTrackTextColor', data.preferences.textColor);
                    if(data.preferences.glass) localStorage.setItem('cineTrackGlass', data.preferences.glass);
                }
                alert("Restore successful! Reloading...");
                location.reload();
            }
        } catch (err) {
            console.error(err);
            alert("Error reading file.");
        }
    };
    reader.readAsText(file);
    input.value = ''; 
}

// --- INIT (RUN AT END) ---
const savedBg = localStorage.getItem('cineTrackBg');
if(savedBg) document.getElementById('bg-layer').style.backgroundImage = `url(${savedBg})`;

const savedColor = localStorage.getItem('cineTrackColor');
if(savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.getElementById('color-picker').value = savedColor;
}
const savedTextColor = localStorage.getItem('cineTrackTextColor');
if(savedTextColor) {
    document.documentElement.style.setProperty('--text-main', savedTextColor);
    document.getElementById('text-color-picker').value = savedTextColor;
}
const isGlass = localStorage.getItem('cineTrackGlass') === 'true';
if(isGlass) {
    document.body.classList.add('glass-theme');
    document.getElementById('glass-toggle').checked = true;
}

const savedViewMode = localStorage.getItem('cineTrackViewMode') || 'grid';
toggleViewMode(savedViewMode);

renderMedia();
updateStats();
