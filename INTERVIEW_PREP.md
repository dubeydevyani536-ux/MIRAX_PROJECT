# 🎓 College Project Hub — Interview Preparation Guide

> **Who this is for:** You, a pre-final year student at IIT Kanpur with a background in AI/ML, presenting this
> full-stack web application to an interviewer. The goal is to show architectural maturity — not just that you
> built something, but that you *understand every decision* you made.

---

## 📌 How to Position This Project in an Interview

> *"I built a College Project Hub — a full-stack role-based web application using Flask, SQLAlchemy, JWT
> authentication, and Vanilla JS. The key differentiator is that I designed it as a proper REST API with a
> decoupled frontend, supporting three distinct user roles with different permissions, automated workflows
> like auto-chat on application acceptance, and features like image uploads and real-time timestamps."*

This project proves you aren't confined to data modeling. It shows you understand **complete end-to-end
infrastructure** — building, securing, and serving applications to real users.

---

## 🗂️ Section 1: Codebase Deconstruction (The 4 Layers)

Never try to memorize lines of code. Instead, explain your project as **4 distinct layers**.

---

### Layer 1 — Data Layer (`models.py`)

This layer defines your **database schema** using SQLAlchemy ORM classes.
Each class = one database table. Each `db.Column` = one column in that table.

#### Your Database Relationship Diagram:

```
User (email = Primary Key)
  │
  ├── one-to-many ──> Project          (posted_by FK → users.email)
  │                     │
  │                     ├── one-to-many ──> ProjectQuestion  (project_id FK)
  │                     └── one-to-many ──> Application      (project_id FK)
  │                                             │
  │                                             └── one-to-many ──> ApplicationAnswer
  │
  ├── one-to-many ──> Application      (applicant_email FK → users.email)
  ├── one-to-many ──> Announcement     (posted_by FK)
  ├── one-to-many ──> SocialPost       (posted_by FK)
  ├── one-to-many ──> Message          (sender_email FK)   ← Two separate FK references
  └── one-to-many ──> Message          (receiver_email FK) ← on the same table
```

#### Key Concepts to Know:

| Concept | Where in Your Code | What to Say |
|---|---|---|
| Primary Key | `email = db.Column(..., primary_key=True)` | Email is the unique identifier for users |
| Foreign Key | `posted_by = db.Column(..., db.ForeignKey('users.email'))` | Links projects back to the user who posted it |
| Relationship | `projects = db.relationship('Project', backref='author')` | SQLAlchemy shortcut — lets you do `user.projects` to get all their projects |
| Cascade Delete | `cascade='all, delete-orphan'` on ProjectQuestion | If a project is deleted, its questions are auto-deleted too |
| Dual FK on Message | `foreign_keys='Message.sender_email'` | Message has two FKs to User — SQLAlchemy needs to be told which one each relationship uses |

#### Interview-Ready Explanation:
> *"I used SQLAlchemy ORM so I never write raw SQL. Each Python class maps to a table.
> `db.relationship()` sets up convenient Python-level joins, while `backref` creates a
> reverse reference — so I can access `project.author.name` directly without writing a JOIN query."*

---

### Layer 2 — Authentication Layer (`auth.py`)

This layer handles **who you are** (Authentication) and **what you can do** (Authorization).

#### The JWT Lifecycle in Your Code:

```
Step 1: User submits email + password (login form)
        │
        ▼
Step 2: Flask checks: bcrypt.checkpw(password, user.password_hash)
        [auth.py, line ~99]
        │
        ▼
Step 3: Flask generates a token:
        jwt.encode({
            'email': user.email,
            'role':  user.role,         ← Role is baked into the token!
            'exp':   now + 24 hours     ← Token auto-expires
        }, JWT_SECRET, algorithm='HS256')
        │
        ▼
Step 4: Browser stores token:
        localStorage.setItem('token', token)    ← api.js: API.setAuth()
        │
        ▼
Step 5: Every future request sends:
        Authorization: Bearer <token>           ← api.js: headers()
        │
        ▼
Step 6: @token_required decorator intercepts each protected route:
        jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
        current_user = User.query.get(data['email'])
        → Injects current_user into the route function
        │
        ▼
Step 7: @role_required('professor', 'coordinator') further restricts
        → Returns 403 Forbidden if role doesn't match
```

#### The 3 Parts of a JWT (MUST KNOW):

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9    ← Header (Base64): algorithm used
.
eyJlbWFpbCI6InRlc3RAY29sbGVnZS5lZHUifQ  ← Payload (Base64): your data (email, role, exp)
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQ  ← Signature (HMAC): Header+Payload signed with secret key
```

> **Can someone manipulate a JWT?**
> *"Yes, anyone can decode the Header and Payload (they're just Base64). But they CANNOT
> forge the Signature without knowing my JWT_SECRET key. So they can read the payload but
> can't change the role from 'student' to 'professor' without the server detecting it."*

#### Authentication vs Authorization:
- **Authentication** = Verifying WHO you are → `@token_required` (checks valid JWT)
- **Authorization** = Verifying WHAT you can do → `@role_required('professor')` (checks role in token)

---

### Layer 3 — Application/Routing Layer (`routes/`)

Your Flask app is a **REST API**. Every route is an endpoint the frontend can call.

#### Your Complete API Endpoints:

| Method | Endpoint | File | Who Can Call | What it Does |
|---|---|---|---|---|
| `POST` | `/api/register` | auth.py | Anyone | Create account with role |
| `POST` | `/api/login` | auth.py | Anyone | Get JWT token |
| `GET` | `/api/me` | auth.py | Logged in | Get own profile |
| `PUT` | `/api/profile` | auth.py | Logged in | Update profile/resume |
| `GET` | `/api/my-applications` | auth.py | Logged in | See my application statuses |
| `GET` | `/api/projects` | projects.py | Logged in | List all projects |
| `POST` | `/api/projects` | projects.py | Professor/Coordinator | Create project |
| `GET` | `/api/projects/<id>` | projects.py | Logged in | Project detail + questions |
| `POST` | `/api/projects/<id>/apply` | projects.py | Student/Coordinator | Submit application |
| `GET` | `/api/projects/<id>/applications` | projects.py | Project owner only | See all applicants |
| `PUT` | `/api/applications/<id>/status` | projects.py | Project owner only | Accept/Reject → **auto-chat** |
| `GET/POST` | `/api/announcements` | announcements.py | All / Prof+Coord | List / Create announcement |
| `GET/POST` | `/api/feed` | feed.py | Logged in | Social posts |
| `GET/POST` | `/api/messages` | messages.py | Logged in | Send message |
| `GET` | `/api/messages/conversations` | messages.py | Logged in | Conversation list |
| `GET` | `/api/messages/<email>` | messages.py | Logged in | Chat thread |
| `GET` | `/api/search` | search.py | Logged in | Search users + projects |

#### HTTP Status Codes You Used (MUST KNOW):

| Code | Meaning | Where You Use It |
|---|---|---|
| `200 OK` | Success, returning data | GET requests |
| `201 Created` | Successfully created | POST (register, create project) |
| `400 Bad Request` | Missing or invalid input | Missing fields in forms |
| `401 Unauthorized` | No/invalid token | `@token_required` fails |
| `403 Forbidden` | Token valid, but wrong role | `@role_required` fails |
| `404 Not Found` | Resource doesn't exist | `get_or_404(pid)` |
| `409 Conflict` | Already exists | "Already applied", "Email taken" |
| `500 Server Error` | Unhandled Python exception | `except Exception as e` |

---

### Layer 4 — Presentation Layer (`static/js/` + `templates/`)

The HTML templates are **skeletons** — mostly empty `<div>` containers.
The JavaScript files are the real **dynamic engine** running in the browser.

#### The Announcement Posting Flow (Concrete Example):

```javascript
// 1. Page loads → JS fetches data from Flask API
const anns = await API.get('/api/announcements');
// → Sends: GET /api/announcements  with Authorization: Bearer <token>

// 2. User clicks "Post Announcement" → modal opens with form

// 3. User fills title, content, selects image, clicks "Post"
//    → submitAnn() is triggered (announcements.js)

// 4. JS builds a FormData object (supports files + text together)
const fd = new FormData();
fd.append('title', title);
fd.append('content', content);
fd.append('image', img);      // Binary image file included

// 5. JS sends it to Flask
const res = await API.postForm('/api/announcements', fd);
// → POST /api/announcements  multipart/form-data

// 6. Flask (announcements.py) receives it:
//    - Validates role (@role_required('coordinator', 'professor'))
//    - Saves image: uploads/images/filename.jpg
//    - Saves Announcement(title, content, image_path) to DB
//    - Returns: {"message": "Announcement posted"}, 201

// 7. JS receives success response:
if (res.ok) {
    closeModal();       // Hide the form popup
    showToast('...');   // Green success notification
    load();             // Re-fetch announcements → page updates instantly
}
```

---

## 📚 Section 2: Core Technical Topics You MUST Know

### 1. JWT vs Session Authentication

| | JWT (What You Used) | Sessions |
|---|---|---|
| State | **Stateless** — server stores nothing | **Stateful** — server stores session data |
| Storage | Browser localStorage | Server memory / database |
| Scalability | Any server can verify any token | All servers need shared session store |
| Expiry | Baked into token (`exp` field) | Server controls session expiry |
| Vulnerability | Token theft (can't invalidate early) | CSRF attacks |

### 2. SQL Relational vs NoSQL

> **Why did you choose SQL (SQLite/MySQL) over MongoDB?**
>
> *"My data is highly structured and relational. Users have Projects, Projects have Applications,
> Applications have Answers — these relationships are perfect for a relational schema with foreign keys
> and joins. NoSQL like MongoDB is better for unstructured, schema-less data like logs or user-generated
> content with varying fields."*

### 3. ORM vs Raw SQL

Your SQLAlchemy query:
```python
Application.query.filter_by(project_id=pid, applicant_email=current_user.email).first()
```
Equivalent raw SQL:
```sql
SELECT * FROM applications
WHERE project_id = 1 AND applicant_email = 'student@college.edu'
LIMIT 1;
```
> **Why ORM?** *"ORM prevents SQL injection attacks, is database-agnostic (I can switch from SQLite to
> MySQL by changing one line in config.py), and lets me work in Python objects instead of SQL strings."*

### 4. CORS (Cross-Origin Resource Sharing)

> *"When the browser is on `localhost:5000` and tries to call an API on `localhost:3000`, browsers block
> this by default as a security measure. `Flask-CORS` adds the `Access-Control-Allow-Origin` header to
> responses, telling the browser it's safe to share data across origins. In production, you'd restrict
> this to your specific domain."*

### 5. `db.session.flush()` vs `db.session.commit()`

Used in your `apply_project` and `create_project` routes:

```python
app = Application(project_id=pid, applicant_email=current_user.email)
db.session.add(app)
db.session.flush()    # ← Sends SQL to DB, assigns app.id — but NOT committed yet
                      #   Needed so we can use app.id for ApplicationAnswer FK below
for q in project.questions:
    db.session.add(ApplicationAnswer(application_id=app.id, ...))
db.session.commit()   # ← Now everything is permanently saved
```

### 6. Password Security (bcrypt)

```python
# On registration: hash the password (NEVER store plain text)
password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

# On login: compare input against hash (can't reverse-engineer the password)
bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8'))
```

> *"bcrypt is a one-way hash — you can't get the original password from the hash. Each hash also includes
> a random 'salt' so two users with the same password get different hashes, preventing rainbow table attacks."*

### 7. The Timestamp Bug Fix

> **"What was the hardest bug you fixed?"**
>
> *"All timestamps were showing '5 hours ago' incorrectly. The root cause: Python's `datetime.utcnow()`
> creates a 'naive' datetime with no timezone info. When JavaScript received the ISO string and called
> `new Date(dateStr)`, it was interpreting it as LOCAL time instead of UTC, causing an offset equal to
> my timezone (IST = UTC+5:30).*
>
> *Fix: (1) Changed all SQLAlchemy defaults to `lambda: datetime.now(timezone.utc)` — explicitly timezone-aware.
> (2) In `timeAgo()` in api.js, I append 'Z' to ISO strings that lack a timezone suffix, forcing the browser
> to treat them as UTC before computing the difference."*

---

## 🏗️ Section 3: Architecture & Design Questions

### "How would you scale this to 10,000 users?"

1. **Database Indexing**: Add indexes on `role`, `project_id`, `applicant_email` columns — these are used in `WHERE` clauses constantly
2. **Connection Pooling**: Configure SQLAlchemy's `pool_size` so multiple requests share DB connections instead of opening new ones
3. **Caching**: Add Redis to cache the announcements and feed (they're read far more than written)
4. **Async**: Switch Flask to FastAPI or use Celery for heavy tasks like sending notification emails
5. **File Storage**: Move uploaded resumes/images from local disk to S3 or similar object storage

### "How did you handle file uploads?"

> *"I did NOT store files as BLOBs in the database — that's a well-known anti-pattern that bloats the DB
> and makes it slow. Instead, I save the physical file to a server directory (`uploads/resumes/` or
> `uploads/images/`) and store only the **relative file path** as a string in the database. To serve the
> file, Flask has a `/uploads/<path:filename>` route that reads from disk."*

### "What security risks does your app have?"

Be honest — this shows maturity:
1. **JWT stored in localStorage** — vulnerable to XSS attacks. Better: `HttpOnly` cookies
2. **No rate limiting** — the login endpoint could be brute-forced
3. **No file type validation on uploads** — should validate MIME type server-side, not just accept attribute
4. **SQLite for production** — not suitable for concurrent writes; should use PostgreSQL or MySQL

### "Why Vanilla JS instead of React?"

> *"For a college project with a small team and moderate complexity, adding React would introduce build
> tooling, state management, and a learning curve that wasn't justified. Vanilla JS with `fetch()` and
> direct DOM manipulation kept the project simple, debuggable, and beginner-friendly while still being
> fully dynamic."*

---

## 🎯 Section 4: Mock Interview Q&A (Practice These Out Loud)

**Q: "Walk me through what happens when a student submits a project application."**

A: *"The student clicks Apply on a project card. JavaScript calls `openApplyModal(pid)` which first GETs
`/api/projects/<pid>` to fetch the custom questions. The modal renders each question as a textarea.
On submit, `submitApplication()` builds a JSON object with `{ answers: { questionId: answerText } }`
and POSTs to `/api/projects/<pid>/apply`. Flask's `apply_project()` route checks the JWT to confirm
the user isn't a professor (403 if so), checks for duplicate applications (409 if exists), creates an
`Application` record, flushes to get the ID, then bulk-inserts `ApplicationAnswer` records for each
question. Commits and returns 201."*

---

**Q: "What happens when a professor accepts an application?"**

A: *"The professor sees all applicants in the modal opened by `viewApplications(pid)`. Clicking Accept calls
`updateAppStatus(aid, 'accepted', pid)` in JS, which PUTs to `/api/applications/<aid>/status`.
In `routes/projects.py`, the `update_status()` route verifies the current user owns the project,
updates `app.status = 'accepted'`, then checks if status changed FROM non-accepted. If so, it
automatically inserts a `Message` record between the professor and the student with a congratulations
message. This means the next time either user opens Messages, the conversation already exists — zero
friction."*

---

**Q: "Explain `@token_required` as a decorator."**

A: *"It's a Python decorator — a function that wraps another function. When Flask receives a request to
a protected route, `@token_required` runs BEFORE the route function itself. It extracts the Bearer
token from the `Authorization` header, calls `jwt.decode()` with my secret key, fetches the User
from the database, and if everything is valid, calls the original route function with `current_user`
injected as the first argument. If anything fails — missing token, expired token, invalid signature
— it returns a 401 response and the route function never runs."*

---

## ✅ Pre-Interview Checklist

### Can you explain without looking at code?
- [ ] Your database schema and all relationships (draw it on paper)
- [ ] The JWT lifecycle from login to protected API call
- [ ] What `@token_required` and `@role_required` decorators do
- [ ] The difference between `flush()` and `commit()`
- [ ] How file uploads work (save to disk, store path in DB)
- [ ] How the timestamp bug was caused and fixed
- [ ] What `backref` does in `db.relationship()`
- [ ] What `cascade='all, delete-orphan'` does
- [ ] The difference between 401 and 403 HTTP status codes
- [ ] Why JWT is stateless and why that matters for scaling

### Phrases to Use:
- *"I designed it as a REST API with a decoupled frontend..."*
- *"The `@token_required` decorator handles authentication at the route level..."*
- *"I used ORM to prevent SQL injection and stay database-agnostic..."*
- *"The auto-chat feature is triggered server-side when status changes to 'accepted'..."*
- *"Passwords are hashed with bcrypt — one-way hash with salt, never stored in plain text..."*

---

*Generated for: College Project Hub Interview Preparation*
*Stack: Flask · SQLAlchemy · JWT · Vanilla JS · SQLite/MySQL*
