document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Projects';
    const user = API.getUser();
    const container = document.getElementById('projectsContent');

    const canPost = ['professor', 'coordinator'].includes(user.role);

    async function loadProjects() {
        const projects = await API.get('/api/projects');
        if (!projects) return;

        let html = '<div class="page-header"><h2>Project Openings</h2>';
        if (canPost) html += '<button class="btn btn-primary" onclick="openCreateModal()">➕ Post Project</button>';
        html += '</div>';

        if (canPost) {
            const myProjects = await API.get('/api/my-projects');
            if (myProjects && myProjects.length > 0) {
                html += '<h3 style="margin-bottom:1rem;">Your Projects</h3><div class="card-grid" style="margin-bottom:2rem;">';
                myProjects.forEach(p => {
                    html += `<div class="card"><div class="card-header"><span class="card-title">${p.title}</span><span class="badge badge-purple">${p.application_count} applications</span></div>
                    <div class="card-body">${p.description.substring(0, 120)}...</div>
                    <div class="card-footer"><span class="tag">${p.required_skills || 'No specific skills'}</span>
                    <button class="btn btn-sm btn-primary" onclick="viewApplications(${p.id})">View Apps</button></div></div>`;
                });
                html += '</div>';
            }
        }

        html += '<h3 style="margin-bottom:1rem;">All Projects</h3>';
        if (projects.length === 0) {
            html += '<div class="empty-state"><div class="empty-icon">🚀</div><h3>No projects yet</h3><p>Check back later for new openings.</p></div>';
        } else {
            html += '<div class="card-grid">';
            projects.forEach(p => {
                const skills = p.required_skills ? p.required_skills.split(',').map(s => `<span class="tag">${s.trim()}</span>`).join('') : '';
                html += `<div class="card"><div class="card-header"><span class="card-title">${p.title}</span><span class="badge ${p.is_club_project ? 'badge-purple' : 'badge-primary'}">${p.is_club_project ? '🏛️ ' + (p.club_name || 'Club') : '👨‍🏫 Professor'}</span></div>
                <div class="card-meta">by ${p.author_name} ${roleBadge(p.author_role)} • ${timeAgo(p.created_at)}</div>
                <div class="card-body">${p.description.substring(0, 150)}${p.description.length > 150 ? '...' : ''}</div>
                <div style="margin-bottom:0.8rem;">${skills}</div>
                <div class="card-footer"><span style="font-size:0.85rem;color:var(--text-light);">📋 ${p.application_count} applied${p.question_count > 0 ? ' • ❓ ' + p.question_count + ' questions' : ''}</span>
                ${user.role !== 'professor' ? `<button class="btn btn-sm btn-primary" onclick="openApplyModal(${p.id})">Apply</button>` : `<button class="btn btn-sm btn-secondary" onclick="viewProjectDetail(${p.id})">View</button>`}</div></div>`;
            });
            html += '</div>';
        }
        container.innerHTML = html;
    }

    window.openCreateModal = () => {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'Post New Project';
        document.getElementById('modalBody').innerHTML = `
            <div class="form-group"><label>Title</label><input id="projTitle" placeholder="Project title"></div>
            <div class="form-group"><label>Description</label><textarea id="projDesc" placeholder="Describe the project..."></textarea></div>
            <div class="form-group"><label>Required Skills (comma separated)</label><input id="projSkills" placeholder="Python, ML, React..."></div>
            <div class="form-group"><label>Custom Questions (optional)</label><div id="questionsContainer"></div>
            <button class="btn btn-sm btn-secondary" type="button" onclick="addQuestion()">➕ Add Question</button></div>`;
        document.getElementById('modalFooter').innerHTML = '<button class="btn btn-primary" onclick="submitProject()">Post Project</button>';
        modal.classList.add('show');
    };

    window.addQuestion = () => {
        const c = document.getElementById('questionsContainer');
        const div = document.createElement('div');
        div.className = 'question-input';
        div.innerHTML = `<input class="q-input" placeholder="Enter question"><button class="remove-q" onclick="this.parentElement.remove()">✕</button>`;
        c.appendChild(div);
    };

    window.submitProject = async () => {
        const title = document.getElementById('projTitle').value.trim();
        const description = document.getElementById('projDesc').value.trim();
        const skills = document.getElementById('projSkills').value.trim();
        const questions = [...document.querySelectorAll('.q-input')].map(i => i.value.trim()).filter(Boolean);
        if (!title || !description) { showToast('Title and description required', 'error'); return; }
        const res = await API.post('/api/projects', { title, description, required_skills: skills, questions });
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Project posted!'); loadProjects(); }
        else showToast(res.error || 'Failed', 'error');
    };

    window.openApplyModal = async (pid) => {
        const project = await API.get(`/api/projects/${pid}`);
        if (!project) return;
        if (project.already_applied) { showToast('Already applied', 'error'); return; }
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'Apply: ' + project.title;
        let body = `<p style="margin-bottom:1rem;color:var(--text-secondary);">${project.description}</p>`;
        if (project.questions.length > 0) {
            body += '<h4 style="margin-bottom:0.8rem;">Answer the questions:</h4>';
            project.questions.forEach(q => { body += `<div class="form-group"><label>${q.question_text}</label><textarea class="answer-input" data-qid="${q.id}" placeholder="Your answer..."></textarea></div>`; });
        }
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('modalFooter').innerHTML = `<button class="btn btn-primary" onclick="submitApplication(${pid})">Submit Application</button>`;
        modal.classList.add('show');
    };

    window.submitApplication = async (pid) => {
        const answers = {};
        document.querySelectorAll('.answer-input').forEach(el => { answers[el.dataset.qid] = el.value.trim(); });
        const res = await API.post(`/api/projects/${pid}/apply`, { answers });
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Application submitted!'); loadProjects(); }
        else showToast(res.error || 'Failed', 'error');
    };

    // View applications with Accept/Reject buttons and role badges
    window.viewApplications = async (pid) => {
        const apps = await API.get(`/api/projects/${pid}/applications`);
        if (!apps) return;
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'Applications';
        let body = '';
        if (apps.length === 0) body = '<div class="empty-state"><p>No applications yet</p></div>';
        else apps.forEach(a => {
            const statusClass = a.status === 'accepted' ? 'status-accepted' : a.status === 'rejected' ? 'status-rejected' : 'status-pending';
            body += `<div class="application-card"><div class="app-header"><div><strong>${a.applicant_name}</strong> ${roleBadge(a.applicant_role)}<div style="font-size:0.85rem;color:var(--text-light);">${a.applicant_email}${a.cpi ? ' • CPI: ' + a.cpi : ''}</div></div>
            <span class="status-pill ${statusClass}">${a.status.charAt(0).toUpperCase() + a.status.slice(1)}</span></div>
            ${a.resume_path ? `<p style="font-size:0.85rem;margin:0.5rem 0;"><a href="/uploads/${a.resume_path}" target="_blank">📄 View Resume</a></p>` : ''}
            ${a.answers.length > 0 ? '<div class="app-answers">' + a.answers.map(ans => `<div class="app-answer"><div class="q">Q: ${ans.question_text}</div><div class="a">${ans.answer_text}</div></div>`).join('') + '</div>' : ''}
            <div style="margin-top:0.8rem;display:flex;gap:0.5rem;">
            <button class="btn btn-sm btn-success" onclick="updateAppStatus(${a.id},'accepted',${pid})">✓ Accept</button>
            <button class="btn btn-sm btn-danger" onclick="updateAppStatus(${a.id},'rejected',${pid})">✗ Reject</button></div></div>`;
        });
        document.getElementById('modalBody').innerHTML = body;
        document.getElementById('modalFooter').innerHTML = '';
        modal.classList.add('show');
    };

    window.updateAppStatus = async (aid, status, pid) => {
        const res = await API.put(`/api/applications/${aid}/status`, { status });
        if (res.ok) {
            showToast(`Application ${status}${status === 'accepted' ? ' — auto-chat created!' : ''}`);
            // Refresh the applications modal
            if (pid) viewApplications(pid);
        }
        else showToast(res.error || 'Failed', 'error');
    };

    window.viewProjectDetail = async (pid) => {
        const p = await API.get(`/api/projects/${pid}`);
        if (!p) return;
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = p.title;
        document.getElementById('modalBody').innerHTML = `<div class="card-meta">by ${p.author_name} ${roleBadge(p.author_role)} • ${timeAgo(p.created_at)}</div><p>${p.description}</p>${p.required_skills ? '<div style="margin-top:1rem;">' + p.required_skills.split(',').map(s => `<span class="tag">${s.trim()}</span>`).join('') + '</div>' : ''}`;
        document.getElementById('modalFooter').innerHTML = '';
        modal.classList.add('show');
    };

    window.closeModal = () => document.getElementById('modal').classList.remove('show');
    loadProjects();
});
