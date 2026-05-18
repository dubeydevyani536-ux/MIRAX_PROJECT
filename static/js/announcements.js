document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Announcements';
    const user = API.getUser();
    const container = document.getElementById('announcementsContent');

    async function load() {
        const anns = await API.get('/api/announcements');
        if (!anns) return;
        let html = '<div class="page-header"><h2>Announcements</h2>';
        if (user.role === 'coordinator' || user.role === 'professor') html += '<button class="btn btn-primary" onclick="openAnnModal()">➕ Post Announcement</button>';
        html += '</div>';
        if (anns.length === 0) html += '<div class="empty-state"><div class="empty-icon">📢</div><h3>No announcements yet</h3></div>';
        else {
            html += '<div class="card-grid">';
            anns.forEach(a => {
                const badge = a.author_role === 'professor' ? `<span class="badge badge-primary">Global</span>` : `<span class="badge badge-purple">${a.club_name || 'Club'}</span>`;
                html += `<div class="card"><div class="card-header"><span class="card-title">${a.title}</span>${badge}</div>
                <div class="card-meta">by ${a.author_name} ${roleBadge(a.author_role)} • ${timeAgo(a.created_at)}</div>
                <div class="card-body">${a.content}${a.image_path ? `<img src="/uploads/${a.image_path}" class="post-image" alt="Announcement image">` : ''}</div></div>`;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    }

    window.openAnnModal = () => {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'Post Announcement';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group"><label>Title</label><input id="annTitle" placeholder="Event title"></div>
            <div class="form-group"><label>Content</label><textarea id="annContent" placeholder="Describe the event..."></textarea></div>
            <div class="form-group"><label>Image (optional)</label><input type="file" id="annImage" accept="image/*"></div>`;
        document.getElementById('modalFooter').innerHTML = '<button class="btn btn-primary" onclick="submitAnn()">Post</button>';
        modal.classList.add('show');
    };

    window.submitAnn = async () => {
        const title = document.getElementById('annTitle').value.trim();
        const content = document.getElementById('annContent').value.trim();
        if (!title || !content) { showToast('All fields required', 'error'); return; }
        const fd = new FormData();
        fd.append('title', title);
        fd.append('content', content);
        const img = document.getElementById('annImage').files[0];
        if (img) fd.append('image', img);
        const res = await API.postForm('/api/announcements', fd);
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Announcement posted!'); load(); }
        else showToast(res.error || 'Failed', 'error');
    };

    window.closeModal = () => document.getElementById('modal').classList.remove('show');
    load();
});
