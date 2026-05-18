document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Showcase';
    const container = document.getElementById('showcaseContent');

    async function load() {
        const items = await API.get('/api/showcase');
        if (!items) return;
        let html = '<div class="page-header"><h2>Project Showcase</h2><button class="btn btn-primary" onclick="openShowcaseModal()">➕ Upload Project</button></div>';
        if (items.length === 0) html += '<div class="empty-state"><div class="empty-icon">💡</div><h3>No showcases yet</h3><p>Be the first to showcase your project!</p></div>';
        else {
            html += '<div class="card-grid">';
            items.forEach(s => {
                html += `<div class="card"><div class="card-header"><span class="card-title">${s.title}</span></div>
                <div class="card-meta">by ${s.author_name} • ${timeAgo(s.created_at)}</div>
                <div class="card-body">${s.description.substring(0, 200)}${s.description.length > 200 ? '...' : ''}</div>
                <div class="card-footer">${s.file_path ? `<a href="/uploads/${s.file_path}" target="_blank" class="btn btn-sm btn-secondary">📥 Download</a>` : '<span></span>'}<span class="badge badge-primary">Showcase</span></div></div>`;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    }

    window.openShowcaseModal = () => {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'Upload Project Showcase';
        document.getElementById('modalBody').innerHTML = `<div class="form-group"><label>Title</label><input id="scTitle" placeholder="Project title"></div><div class="form-group"><label>Description</label><textarea id="scDesc" placeholder="Describe your project..."></textarea></div><div class="form-group"><label>Project File (ZIP)</label><input type="file" id="scFile" accept=".zip"></div>`;
        document.getElementById('modalFooter').innerHTML = '<button class="btn btn-primary" onclick="submitShowcase()">Upload</button>';
        modal.classList.add('show');
    };

    window.submitShowcase = async () => {
        const fd = new FormData();
        fd.append('title', document.getElementById('scTitle').value.trim());
        fd.append('description', document.getElementById('scDesc').value.trim());
        const file = document.getElementById('scFile').files[0];
        if (file) fd.append('project_file', file);
        if (!fd.get('title') || !fd.get('description')) { showToast('Title and description required', 'error'); return; }
        const res = await API.postForm('/api/showcase', fd);
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Showcase uploaded!'); load(); }
        else showToast(res.error || 'Failed', 'error');
    };

    window.closeModal = () => document.getElementById('modal').classList.remove('show');
    load();
});
