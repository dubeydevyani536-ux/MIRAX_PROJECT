document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Social Feed';
    const container = document.getElementById('feedContent');

    async function load() {
        const posts = await API.get('/api/feed');
        if (!posts) return;
        let html = `<div class="feed-post-box">
            <textarea id="postContent" placeholder="Share an update, thought, or achievement..."></textarea>
            <div class="post-actions">
                <div class="image-upload-row"><label for="postImage">📷 Add Image</label><input type="file" id="postImage" accept="image/*" style="display:none"><span id="postImageName" style="font-size:0.8rem;color:var(--text-light);"></span></div>
                <button class="btn btn-primary" onclick="submitPost()">📝 Publish</button>
            </div></div>`;
        if (posts.length === 0) html += '<div class="empty-state"><div class="empty-icon">📰</div><h3>No posts yet</h3><p>Be the first to share something!</p></div>';
        else posts.forEach(p => {
            html += `<div class="feed-item"><div class="feed-author"><div class="avatar">${p.author_name.charAt(0).toUpperCase()}</div><div class="author-info"><div class="name">${p.author_name} ${roleBadge(p.author_role)}</div><div class="meta">${timeAgo(p.created_at)}</div></div></div><div class="feed-content">${p.content.replace(/\n/g, '<br>')}${p.image_path ? `<img src="/uploads/${p.image_path}" class="post-image" alt="Post image">` : ''}</div></div>`;
        });
        container.innerHTML = html;
        // Wire up image name display
        const imgInput = document.getElementById('postImage');
        if (imgInput) imgInput.onchange = () => { document.getElementById('postImageName').textContent = imgInput.files[0] ? imgInput.files[0].name : ''; };
    }

    window.submitPost = async () => {
        const content = document.getElementById('postContent').value.trim();
        if (!content) { showToast('Write something first!', 'error'); return; }
        const fd = new FormData();
        fd.append('content', content);
        const img = document.getElementById('postImage').files[0];
        if (img) fd.append('image', img);
        const res = await API.postForm('/api/feed', fd);
        if (res.ok) { showToast('Post published!'); load(); } else showToast(res.error || 'Failed', 'error');
    };
    load();
});
