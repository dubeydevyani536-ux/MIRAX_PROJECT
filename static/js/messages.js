document.addEventListener('DOMContentLoaded', async () => {
    if (!API.requireAuth()) return;
    initSidebar();
    document.getElementById('pageTitle').textContent = 'Messages';
    const user = API.getUser();
    let activeChat = null;

    async function loadConversations() {
        const convos = await API.get('/api/messages/conversations');
        const list = document.getElementById('convoList');
        if (!convos || convos.length === 0) { list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--text-light);">No conversations yet</div>'; return; }
        list.innerHTML = convos.map(c => `<div class="convo-item ${activeChat === c.email ? 'active' : ''}" onclick="openChat('${c.email}','${c.name}')">
            <div class="avatar">${c.name.charAt(0).toUpperCase()}</div>
            <div class="convo-info"><div class="convo-name">${c.name} ${roleBadge(c.role)}</div>
            <div class="convo-preview">${c.last_message}</div></div></div>`).join('');
    }

    window.openChat = async (email, name) => {
        activeChat = email;
        loadConversations();
        const msgs = await API.get(`/api/messages/${email}`);
        const chatArea = document.getElementById('chatArea');
        chatArea.innerHTML = `<div class="chat-header">💬 ${name}</div>
            <div class="chat-messages" id="chatMessages">${!msgs || msgs.length === 0 ? '<div style="text-align:center;color:var(--text-light);margin:auto;">No messages yet. Say hello!</div>' :
            msgs.map(m => `<div class="message-bubble ${m.sender_email === user.email ? 'sent' : 'received'} ${m.is_pitch ? 'pitch' : ''}">
                ${m.is_pitch ? `<div class="pitch-label">💡 Pitch: ${m.pitch_title || 'Idea'}</div>` : ''}
                ${m.content}<div class="msg-time">${timeAgo(m.created_at)}</div></div>`).join('')}</div>
            <div class="chat-input"><input id="msgInput" placeholder="Type a message..." onkeydown="if(event.key==='Enter')sendMsg()"><button class="btn btn-primary" onclick="sendMsg()">Send</button></div>`;
        const el = document.getElementById('chatMessages');
        el.scrollTop = el.scrollHeight;
    };

    window.sendMsg = async () => {
        const input = document.getElementById('msgInput');
        const content = input.value.trim();
        if (!content || !activeChat) return;
        const res = await API.post('/api/messages', { receiver_email: activeChat, content });
        if (res.ok) { input.value = ''; openChat(activeChat, document.querySelector('.chat-header').textContent.replace('💬 ', '')); }
        else showToast(res.error || 'Failed', 'error');
    };

    // New message button
    window.newMessage = () => {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = 'New Message';
        document.getElementById('modalBody').innerHTML = `<div class="form-group"><label>Recipient Email</label><input id="newMsgTo" placeholder="user@college.edu"></div><div class="form-group"><label>Message</label><textarea id="newMsgContent" placeholder="Your message..."></textarea></div>`;
        document.getElementById('modalFooter').innerHTML = '<button class="btn btn-primary" onclick="sendNewMsg()">Send</button>';
        modal.classList.add('show');
    };

    window.sendNewMsg = async () => {
        const to = document.getElementById('newMsgTo').value.trim();
        const content = document.getElementById('newMsgContent').value.trim();
        if (!to || !content) { showToast('Fill all fields', 'error'); return; }
        const res = await API.post('/api/messages', { receiver_email: to, content });
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Message sent!'); loadConversations(); }
        else showToast(res.error || 'Failed', 'error');
    };

    // Pitch button
    window.newPitch = () => {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = '💡 Pitch an Idea';
        document.getElementById('modalBody').innerHTML = `<div class="form-group"><label>To (Professor/Coordinator Email)</label><input id="pitchTo" placeholder="prof@college.edu"></div><div class="form-group"><label>Idea Title</label><input id="pitchTitle" placeholder="My project idea"></div><div class="form-group"><label>Description</label><textarea id="pitchDesc" placeholder="Describe your idea..."></textarea></div>`;
        document.getElementById('modalFooter').innerHTML = '<button class="btn btn-primary" onclick="sendPitch()">Send Pitch</button>';
        modal.classList.add('show');
    };

    window.sendPitch = async () => {
        const to = document.getElementById('pitchTo').value.trim();
        const title = document.getElementById('pitchTitle').value.trim();
        const desc = document.getElementById('pitchDesc').value.trim();
        if (!to || !title || !desc) { showToast('Fill all fields', 'error'); return; }
        const res = await API.post('/api/pitch', { receiver_email: to, title, description: desc });
        if (res.ok) { document.getElementById('modal').classList.remove('show'); showToast('Pitch sent!'); loadConversations(); }
        else showToast(res.error || 'Failed', 'error');
    };

    window.closeModal = () => document.getElementById('modal').classList.remove('show');

    // Add action buttons
    document.getElementById('msgActions').innerHTML = `<button class="btn btn-sm btn-primary" onclick="newMessage()">✉️ New Message</button><button class="btn btn-sm btn-secondary" onclick="newPitch()" style="margin-left:0.5rem;">💡 Pitch Idea</button>`;
    loadConversations();
});
