document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Dashboard';
    const user = API.getUser();
    const content = document.getElementById('dashContent');

    // Load stats
    const [projects, announcements, showcases, feed, myApps] = await Promise.all([
        API.get('/api/projects'), API.get('/api/announcements'),
        API.get('/api/showcase'), API.get('/api/feed'),
        API.get('/api/my-applications')
    ]);

    let statsHTML = '<div class="stats-grid">';
    statsHTML += `<div class="stat-card"><div class="stat-icon">🚀</div><div class="stat-value">${projects ? projects.length : 0}</div><div class="stat-label">Open Projects</div></div>`;
    statsHTML += `<div class="stat-card"><div class="stat-icon">📢</div><div class="stat-value">${announcements ? announcements.length : 0}</div><div class="stat-label">Announcements</div></div>`;
    statsHTML += `<div class="stat-card"><div class="stat-icon">💡</div><div class="stat-value">${showcases ? showcases.length : 0}</div><div class="stat-label">Showcases</div></div>`;
    statsHTML += `<div class="stat-card"><div class="stat-icon">📰</div><div class="stat-value">${feed ? feed.length : 0}</div><div class="stat-label">Feed Posts</div></div>`;
    statsHTML += '</div>';

    // Role-specific welcome
    let welcomeHTML = `<div class="card" style="margin-bottom:1.5rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;">
        <h2 style="margin-bottom:0.5rem;">Welcome back, ${user.name}! 👋</h2>
        <p style="opacity:0.9;">You're logged in as <strong style="text-transform:capitalize;">${user.role}</strong>${user.club_name ? ` — ${user.club_name}` : ''}${user.cpi ? ` • CPI: ${user.cpi}` : ''}</p></div>`;

    // Quick actions based on role
    let actionsHTML = '<h3 style="margin-bottom:1rem;">Quick Actions</h3><div class="card-grid">';
    if (user.role === 'professor' || user.role === 'coordinator') {
        actionsHTML += `<div class="card" onclick="location.href='/projects'" style="cursor:pointer"><h4>📝 Post a Project</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Create a new project opening with custom questions</p></div>`;
        actionsHTML += `<div class="card" onclick="location.href='/announcements'" style="cursor:pointer"><h4>📢 Post Announcement</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Share updates or event info</p></div>`;
    }
    actionsHTML += `<div class="card" onclick="location.href='/projects'" style="cursor:pointer"><h4>🔍 Browse Projects</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Explore available project openings</p></div>`;
    actionsHTML += `<div class="card" onclick="location.href='/feed'" style="cursor:pointer"><h4>📰 Social Feed</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Share updates and achievements</p></div>`;
    actionsHTML += `<div class="card" onclick="location.href='/showcase'" style="cursor:pointer"><h4>💡 Showcase</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Upload or browse project showcases</p></div>`;
    actionsHTML += `<div class="card" onclick="location.href='/messages'" style="cursor:pointer"><h4>💬 Messages</h4><p style="color:var(--text-secondary);margin-top:0.5rem;">Chat with other users or pitch ideas</p></div>`;
    actionsHTML += '</div>';

    // My Applications section (for students/coordinators)
    let appsHTML = '';
    if (myApps && myApps.length > 0 && user.role !== 'professor') {
        appsHTML = '<h3 style="margin:2rem 0 1rem;">📋 My Applications</h3><div class="card-grid">';
        myApps.forEach(a => {
            const statusClass = a.status === 'accepted' ? 'status-accepted' : a.status === 'rejected' ? 'status-rejected' : 'status-pending';
            appsHTML += `<div class="card">
                <div class="card-header"><span class="card-title">${a.project_title}</span><span class="status-pill ${statusClass}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></div>
                <div class="card-meta">by ${a.posted_by_name} ${roleBadge(a.posted_by_role)} • Applied ${timeAgo(a.created_at)}</div>
                ${a.status === 'accepted' ? '<div style="margin-top:0.5rem;"><a href="/messages" class="btn btn-sm btn-success">💬 Chat with Poster</a></div>' : ''}
            </div>`;
        });
        appsHTML += '</div>';
    }

    // Recent projects
    let recentHTML = '';
    if (projects && projects.length > 0) {
        recentHTML = '<h3 style="margin:2rem 0 1rem;">Recent Projects</h3><div class="card-grid">';
        projects.slice(0, 3).forEach(p => {
            recentHTML += `<div class="card"><div class="card-header"><span class="card-title">${p.title}</span><span class="badge badge-primary">${p.is_club_project ? 'Club' : 'Professor'}</span></div>
            <div class="card-meta">by ${p.author_name} ${roleBadge(p.author_role)} • ${timeAgo(p.created_at)}</div>
            <div class="card-body">${p.description.substring(0, 120)}...</div>
            <div class="card-footer"><span class="tag">📋 ${p.application_count} applied</span><a href="/projects" class="btn btn-sm btn-secondary">View</a></div></div>`;
        });
        recentHTML += '</div>';
    }

    content.innerHTML = welcomeHTML + statsHTML + actionsHTML + appsHTML + recentHTML;
});
