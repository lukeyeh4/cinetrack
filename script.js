const API_KEY = '78deb1e2'; // Your Key

let mediaList = JSON.parse(localStorage.getItem('cineTrackData')) || [];

const form = document.getElementById('movie-form');
const listContainer = document.getElementById('movie-list');
const emptyState = document.getElementById('empty-state');
const navButtons = document.querySelectorAll('.nav-btn');

renderMedia('all');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const type = document.getElementById('type').value;
    const status = document.getElementById('status').value;
    const rating = document.getElementById('rating').value;
    const dateWatched = document.getElementById('date-watched').value; // Get Date
    const notes = document.getElementById('notes').value; // Get Notes

    let posterUrl = 'https://via.placeholder.com/300x450?text=No+Poster'; 

    try {
        const res = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${API_KEY}`);
        const data = await res.json();
        if (data.Poster && data.Poster !== 'N/A') posterUrl = data.Poster;
    } catch (error) { console.error("Error fetching poster:", error); }

    const newItem = {
        id: Date.now(),
        title, type, status, rating, poster: posterUrl,
        dateWatched, // Save Date
        notes        // Save Notes
    };

    mediaList.push(newItem);
    saveAndRender();
    form.reset();
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
        
        let statusClass = '';
        let statusText = '';
        if(item.status === 'towatch') { statusClass = 'status-towatch'; statusText = 'To Watch'; }
        if(item.status === 'watching') { statusClass = 'status-watching'; statusText = 'Watching'; }
        if(item.status === 'seen') { statusClass = 'status-seen'; statusText = 'Seen'; }

        // Render Card with Date and Notes
        card.innerHTML = `
            <img src="${item.poster}" class="card-poster" alt="${item.title}">
            <div class="card-meta">
                <span>${item.type}</span>
                <span class="card-badge ${statusClass}">${statusText}</span>
            </div>
            <h3>${item.title}</h3>
            
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
