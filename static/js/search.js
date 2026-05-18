document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Search';
    const input = document.getElementById('searchInput');
    const container = document.getElementById('searchResults');

    let timeout;
    input.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => doSearch(input.value.trim()), 400);
    });

    async function doSearch(q) {
        if (!q) { container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Search for users or projects</h3><p>Try a name, email, or project title</p></div>'; return; }
        const data = await API.get(`/api/search?q=${encodeURIComponent(q)}`);
        if (!data) return;
        let html = '';
        if (data.users.length > 0) {
            html += '<div class="search-results-section"><h3>👤 Users</h3>';
            data.users.forEach(u => {
                html += `<div class="user-result" onclick="window.open('/messages','_self')"><div class="avatar">${u.name.charAt(0).toUpperCase()}</div><div class="user-details"><div class="name">${u.name} ${roleBadge(u.role)}</div><div class="email">${u.email}${u.cpi ? ' • CPI: ' + u.cpi : ''}${u.club_name ? ' • ' + u.club_name : ''}</div></div></div>`;
            });
            html += '</div>';
        }
        if (data.projects.length > 0) {
            html += '<div class="search-results-section"><h3>🚀 Projects</h3><div class="card-grid">';
            data.projects.forEach(p => {
                html += `<div class="card" onclick="window.open('/projects','_self')" style="cursor:pointer"><div class="card-title">${p.title}</div><div class="card-meta">by ${p.posted_by} • ${timeAgo(p.created_at)}</div><div class="card-body">${p.description}</div></div>`;
            });
            html += '</div></div>';
        }
        if (data.users.length === 0 && data.projects.length === 0) html = '<div class="empty-state"><div class="empty-icon">😕</div><h3>No results found</h3><p>Try a different keyword</p></div>';
        container.innerHTML = html;
    }
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔍</div><h3>Search for users or projects</h3><p>Try a name, email, or project title</p></div>';
});
