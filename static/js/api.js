// Shared API helper + JWT token management
const API = {
    getToken() { return localStorage.getItem('token'); },
    getUser() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
    setAuth(token, user) { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); },
    clearAuth() { localStorage.removeItem('token'); localStorage.removeItem('user'); },
    headers(isJson = true) {
        const h = { 'Authorization': 'Bearer ' + this.getToken() };
        if (isJson) h['Content-Type'] = 'application/json';
        return h;
    },
    async get(url) {
        const res = await fetch(url, { headers: this.headers() });
        if (res.status === 401) { this.clearAuth(); window.location.href = '/'; return null; }
        return res.json();
    },
    async post(url, body) {
        const res = await fetch(url, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) });
        return res.json().then(data => ({ ...data, ok: res.ok, status: res.status }));
    },
    async postForm(url, formData) {
        const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + this.getToken() }, body: formData });
        return res.json().then(data => ({ ...data, ok: res.ok, status: res.status }));
    },
    async put(url, body) {
        const res = await fetch(url, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) });
        return res.json().then(data => ({ ...data, ok: res.ok, status: res.status }));
    },
    async putForm(url, formData) {
        const res = await fetch(url, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + this.getToken() }, body: formData });
        return res.json().then(data => ({ ...data, ok: res.ok, status: res.status }));
    },
    requireAuth() { if (!this.getToken()) { window.location.href = '/'; return false; } return true; },
    logout() { this.clearAuth(); window.location.href = '/'; }
};

// Inject sidebar into pages
function initSidebar() {
    const user = API.getUser();
    if (!user) return;
    const nav = [
        { href: '/dashboard', icon: '📊', label: 'Dashboard' },
        { href: '/projects', icon: '🚀', label: 'Projects' },
        { href: '/announcements', icon: '📢', label: 'Announcements' },
        { href: '/showcase', icon: '💡', label: 'Showcase' },
        { href: '/feed', icon: '📰', label: 'Social Feed' },
        { href: '/messages', icon: '💬', label: 'Messages' },
        { href: '/search', icon: '🔍', label: 'Search' },
        { href: '/profile', icon: '⚙️', label: 'Profile Settings' },
    ];
    const current = window.location.pathname;
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    sidebar.innerHTML = `
        <div class="sidebar-brand"><span class="brand-icon">🎓</span><h2>Project Hub</h2></div>
        <nav class="sidebar-nav">${nav.map(n => `<a href="${n.href}" class="nav-item ${current === n.href ? 'active' : ''}""><span class="nav-icon">${n.icon}</span>${n.label}</a>`).join('')}</nav>
        <div class="sidebar-footer">
            <div class="user-info">
                <div class="avatar">${user.name.charAt(0).toUpperCase()}</div>
                <div><div class="user-name">${user.name}</div><div class="user-role">${user.role}</div></div>
            </div>
            <button class="logout-btn" onclick="API.logout()">🚪 Logout</button>
        </div>`;
}

// FIX #1: Proper UTC-aware relative time calculation
function timeAgo(dateStr) {
    if (!dateStr) return '';
    // Backend sends ISO strings without timezone — they are UTC
    let utcStr = dateStr;
    if (!utcStr.endsWith('Z') && !utcStr.includes('+')) {
        utcStr += 'Z'; // Mark as UTC
    }
    const diff = (Date.now() - new Date(utcStr).getTime()) / 1000;
    if (diff < 0) return 'just now';
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' mins ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
    if (diff < 604800) return Math.floor(diff / 86400) + ' days ago';
    return new Date(utcStr).toLocaleDateString();
}

// FEATURE #5: Color-coded role badge HTML helper
function roleBadge(role) {
    if (!role) return '';
    const labels = { professor: 'Professor', coordinator: 'Coordinator', student: 'Student' };
    return `<span class="role-badge role-badge-${role}">${labels[role] || role}</span>`;
}

function showToast(msg, type = 'success') {
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 20px;border-radius:8px;color:white;font-weight:600;z-index:9999;animation:fadeIn 0.3s;font-size:0.9rem;`;
    t.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}
