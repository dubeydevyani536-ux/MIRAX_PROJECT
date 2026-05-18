document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Profile Settings';
    const container = document.getElementById('profileContent');

    // Fetch fresh user data from server
    const me = await API.get('/api/me');
    if (!me) return;

    let formFields = '';

    // Common field: name
    formFields += `<div class="form-group"><label>Full Name</label><input id="profName" value="${me.name}"></div>`;
    formFields += `<div class="form-group"><label>Email</label><input value="${me.email}" disabled style="background:#f1f5f9;cursor:not-allowed;"></div>`;

    // Student / Coordinator fields
    if (me.role === 'student' || me.role === 'coordinator') {
        formFields += `<div class="form-group"><label>CPI (CGPA)</label><input type="number" id="profCpi" step="0.01" min="0" max="10" value="${me.cpi || ''}"></div>`;
        formFields += `<div class="form-group"><label>Resume (PDF) ${me.resume_path ? '— <a href="/uploads/' + me.resume_path + '" target="_blank">View current</a>' : ''}</label><input type="file" id="profResume" accept=".pdf"></div>`;
    }
    if (me.role === 'coordinator') {
        formFields += `<div class="form-group"><label>Club Name</label><input id="profClub" value="${me.club_name || ''}"></div>`;
    }

    // Professor fields
    if (me.role === 'professor') {
        formFields += `<div class="form-group"><label>Research Interest Areas</label><textarea id="profResearch" style="min-height:80px;">${me.research_interests || ''}</textarea></div>`;
    }

    container.innerHTML = `<div class="profile-container">
        <div class="profile-card">
            <div class="profile-header">
                <div class="profile-avatar">${me.name.charAt(0).toUpperCase()}</div>
                <div class="profile-info"><h2>${me.name} ${roleBadge(me.role)}</h2><p>${me.email}</p></div>
            </div>
            <form id="profileForm">${formFields}
                <button type="submit" class="btn btn-primary btn-block" style="margin-top:1rem;">💾 Save Changes</button>
            </form>
            <p style="text-align:center;margin-top:1rem;font-size:0.8rem;color:var(--text-light);">Member since ${me.created_at ? new Date(me.created_at).toLocaleDateString() : 'N/A'}</p>
        </div>
    </div>`;

    // Handle form submit
    document.getElementById('profileForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('name', document.getElementById('profName').value.trim());

        if (me.role === 'student' || me.role === 'coordinator') {
            fd.append('cpi', document.getElementById('profCpi').value);
            const resume = document.getElementById('profResume').files[0];
            if (resume) fd.append('resume', resume);
        }
        if (me.role === 'coordinator') {
            fd.append('club_name', document.getElementById('profClub').value.trim());
        }
        if (me.role === 'professor') {
            fd.append('research_interests', document.getElementById('profResearch').value.trim());
        }

        const res = await API.putForm('/api/profile', fd);
        if (res.ok) {
            // Update local storage with new user data
            API.setAuth(API.getToken(), res.user);
            showToast('Profile updated!');
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(res.error || 'Update failed', 'error');
        }
    };
});
