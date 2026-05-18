document.addEventListener('DOMContentLoaded', () => {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const roleOptions = document.querySelectorAll('.role-option');
    const roleInput = document.getElementById('regRole');
    const alertBox = document.getElementById('authAlert');

    // Tab switching
    loginTab.onclick = () => { loginTab.classList.add('active'); registerTab.classList.remove('active'); loginForm.classList.remove('hidden'); registerForm.classList.add('hidden'); clearAlert(); };
    registerTab.onclick = () => { registerTab.classList.add('active'); loginTab.classList.remove('active'); registerForm.classList.remove('hidden'); loginForm.classList.add('hidden'); clearAlert(); };

    // Role selection with conditional fields
    roleOptions.forEach(opt => {
        opt.onclick = () => {
            roleOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            roleInput.value = opt.dataset.role;
            document.getElementById('cpiField').classList.toggle('show', ['student', 'coordinator'].includes(opt.dataset.role));
            document.getElementById('resumeField').classList.toggle('show', ['student', 'coordinator'].includes(opt.dataset.role));
            document.getElementById('clubField').classList.toggle('show', opt.dataset.role === 'coordinator');
            document.getElementById('researchField').classList.toggle('show', opt.dataset.role === 'professor');
        };
    });

    function showAlert(msg, type = 'error') { alertBox.className = `alert alert-${type}`; alertBox.textContent = msg; alertBox.classList.remove('hidden'); }
    function clearAlert() { alertBox.classList.add('hidden'); }

    // Login
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        clearAlert();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        if (!email || !password) { showAlert('Please fill in all fields'); return; }
        try {
            const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const data = await res.json();
            if (res.ok) { API.setAuth(data.token, data.user); window.location.href = '/dashboard'; }
            else showAlert(data.error || 'Login failed');
        } catch { showAlert('Network error'); }
    };

    // Register
    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        clearAlert();
        const fd = new FormData();
        fd.append('name', document.getElementById('regName').value.trim());
        fd.append('email', document.getElementById('regEmail').value.trim());
        fd.append('password', document.getElementById('regPassword').value.trim());
        fd.append('role', roleInput.value);
        if (['student', 'coordinator'].includes(roleInput.value)) {
            fd.append('cpi', document.getElementById('regCpi').value);
            const resume = document.getElementById('regResume').files[0];
            if (resume) fd.append('resume', resume);
        }
        if (roleInput.value === 'coordinator') fd.append('club_name', document.getElementById('regClub').value.trim());
        if (roleInput.value === 'professor') fd.append('research_interests', document.getElementById('regResearch').value.trim());
        if (!fd.get('name') || !fd.get('email') || !fd.get('password') || !fd.get('role')) { showAlert('Please fill all required fields'); return; }
        try {
            const res = await fetch('/api/register', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) { showAlert('Registration successful! Please login.', 'success'); loginTab.click(); }
            else showAlert(data.error || 'Registration failed');
        } catch { showAlert('Network error'); }
    };

    // Redirect if already logged in
    if (API.getToken()) window.location.href = '/dashboard';
});
