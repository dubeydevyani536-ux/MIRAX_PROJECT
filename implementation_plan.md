# College Project Hub — Implementation Plan

A full-stack web application for college collaboration: project postings, applications, announcements, showcases, social feed, messaging, and global search.

## Tech Stack

|Layer|Technology|
|-|-|
|Frontend|Vanilla HTML, CSS, JavaScript|
|Backend|Flask (Python)|
|Database|MySQL via SQLAlchemy ORM|
|Auth|JWT (PyJWT) with role-based access|
|File uploads|Flask file handling (resume PDFs, project ZIPs)|

\---

## Project Structure

```
c:\\\\Users\\\\dewan\\\\Desktop\\\\project\\\\
├── app.py                    # Flask entry point
├── config.py                 # DB URI, JWT secret, upload config
├── models.py                 # All SQLAlchemy models
├── auth.py                   # Register/Login + JWT decorator
├── routes/
│   ├── projects.py           # Project CRUD + applications
│   ├── announcements.py      # Club announcements
│   ├── showcase.py           # Student project showcase
│   ├── feed.py               # Social feed posts
│   ├── messages.py           # 1-on-1 messaging
│   ├── search.py             # Global search
│   └── pitch.py              # Pitch ideas to professors/coordinators
├── uploads/                  # Uploaded files (resumes, zips)	1
├── static/
│   ├── css/
│   │   └── style.css         # All styles
│   ├── js/
│   │   ├── auth.js           # Login/Register logic
│   │   ├── dashboard.js      # Role-specific dashboard
│   │   ├── projects.js       # Browse/post/apply projects
│   │   ├── announcements.js  # Announcements page
│   │   ├── showcase.js       # Showcase page
│   │   ├── feed.js           # Social feed
│   │   ├── messages.js       # Chat/messaging
│   │   ├── search.js         # Global search
│   │   └── api.js            # Shared fetch helpers + JWT storage
│   └── images/               # Any static assets
└── templates/
    ├── index.html            # Landing / Login / Register
    ├── dashboard.html        # Main dashboard (SPA-like)
    ├── projects.html         # Projects listing + detail
    ├── announcements.html    # Announcements page
    ├── showcase.html         # Showcase page
    ├── feed.html             # Social feed
    ├── messages.html         # Messaging page
    └── search.html           # Search results
```

\---

## Database Models (SQLAlchemy)

### User

|Column|Type|Notes|
|-|-|-|
|email|String(120), PK|College email|
|password\_hash|String(256)|bcrypt hashed|
|name|String(100)|Full name|
|role|Enum('student','coordinator','professor')|Set at registration|
|cpi|Float, nullable|Required for student/coordinator|
|resume\_path|String(256), nullable|PDF path, required for student/coordinator|
|club\_name|String(100), nullable|Required for coordinator|
|created\_at|DateTime|Auto|

### Project

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK, auto||
|title|String(200)||
|description|Text||
|required\_skills|Text|Comma-separated or free text|
|posted\_by|FK → User.email|Professor or coordinator|
|is\_club\_project|Boolean|True if coordinator posted|
|created\_at|DateTime||

### ProjectQuestion

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|project\_id|FK → Project.id||
|question\_text|Text||
|order\_num|Integer|Display ordering|

### Application

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|project\_id|FK → Project.id||
|applicant\_email|FK → User.email||
|status|Enum('pending','accepted','rejected')|Default 'pending'|
|created\_at|DateTime||

### ApplicationAnswer

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|application\_id|FK → Application.id||
|question\_id|FK → ProjectQuestion.id||
|answer\_text|Text||

### Announcement

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|title|String(200)||
|content|Text|Event description|
|posted\_by|FK → User.email|Coordinator only|
|created\_at|DateTime||

### Showcase

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|title|String(200)||
|description|Text||
|file\_path|String(256)|Uploaded ZIP path|
|posted\_by|FK → User.email||
|created\_at|DateTime||

### SocialPost

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|content|Text||
|posted\_by|FK → User.email||
|created\_at|DateTime||

### Message

|Column|Type|Notes|
|-|-|-|
|id|Integer, PK||
|sender\_email|FK → User.email||
|receiver\_email|FK → User.email||
|content|Text||
|is\_pitch|Boolean|True if this is a project pitch|
|created\_at|DateTime||

\---

## API Endpoints

### Auth (`auth.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/register`|Public|Register with role, email, password, etc.|
|POST|`/api/login`|Public|Returns JWT token|
|GET|`/api/me`|Authenticated|Get current user profile|

### Projects (`routes/projects.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/projects`|Professor/Coordinator|Create project + optional questions|
|GET|`/api/projects`|Authenticated|List all projects|
|GET|`/api/projects/<id>`|Authenticated|Project detail + questions|
|POST|`/api/projects/<id>/apply`|Student/Coordinator|Apply with answers|
|GET|`/api/projects/<id>/applications`|Project owner|View all applications|
|PUT|`/api/applications/<id>/status`|Project owner|Accept/reject application|

### Announcements (`routes/announcements.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/announcements`|Coordinator|Create announcement|
|GET|`/api/announcements`|Authenticated|List announcements|

### Showcase (`routes/showcase.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/showcase`|Authenticated|Upload project showcase|
|GET|`/api/showcase`|Authenticated|List all showcases|
|GET|`/api/showcase/<id>`|Authenticated|Detail view|

### Social Feed (`routes/feed.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/feed`|Authenticated|Create post|
|GET|`/api/feed`|Authenticated|List feed posts|

### Messages (`routes/messages.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/messages`|Authenticated|Send message (or pitch)|
|GET|`/api/messages/conversations`|Authenticated|List conversations|
|GET|`/api/messages/<email>`|Authenticated|Get thread with user|

### Search (`routes/search.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|GET|`/api/search?q=keyword`|Authenticated|Search users + projects|

### Pitch (`routes/pitch.py`)

|Method|Path|Access|Description|
|-|-|-|-|
|POST|`/api/pitch`|Student/Coordinator|Send pitch idea to a professor/coordinator|
|GET|`/api/pitch/received`|Professor/Coordinator|View pitches received|

\---

## Frontend Pages

|Page|Description|
|-|-|
|`index.html`|Login \& Register forms with role-based dynamic fields|
|`dashboard.html`|Role-specific dashboard with navigation sidebar|
|`projects.html`|Browse projects, post projects (if professor/coordinator), apply|
|`announcements.html`|View/post announcements|
|`showcase.html`|Upload and browse project showcases|
|`feed.html`|LinkedIn-style social feed|
|`messages.html`|1-on-1 chat interface|
|`search.html`|Global search results|

> \\\[!NOTE]
> The frontend uses multi-page architecture (not SPA). Each page stores the JWT in `localStorage` and uses `fetch()` for API calls. Navigation is via a shared sidebar/navbar injected by JS.

\---

## Design Approach

* **Color palette**: Deep indigo (#1e1b4b) + violet accents (#7c3aed) + clean whites
* **Typography**: Google Fonts — Inter for body, Outfit for headings
* **Cards**: Rounded corners, subtle shadows, hover lift animations
* **Navigation**: Fixed left sidebar with icons + labels
* **Responsive**: Flexbox/Grid based, mobile-friendly
* **Micro-animations**: Smooth transitions on hovers, page loads, and card interactions

\---

## Build Order (Phased)

### Phase 1 — Foundation

1. `config.py` — DB URI, JWT secret, upload folder
2. `models.py` — All SQLAlchemy models
3. `auth.py` — Register/Login + JWT decorator
4. `app.py` — Flask app setup, register blueprints, serve templates
5. `static/css/style.css` — Full design system
6. `static/js/api.js` — Shared fetch helper + token management

### Phase 2 — Auth Frontend

7. `templates/index.html` — Login/Register page
8. `static/js/auth.js` — Form handling

### Phase 3 — Dashboard + Projects

9. `templates/dashboard.html` — Role-based dashboard
10. `static/js/dashboard.js` — Dashboard logic
11. `routes/projects.py` — Projects API
12. `templates/projects.html` + `static/js/projects.js`

### Phase 4 — Announcements + Showcase

13. `routes/announcements.py` + frontend
14. `routes/showcase.py` + frontend

### Phase 5 — Social Feed + Search

15. `routes/feed.py` + frontend
16. `routes/search.py` + frontend

### Phase 6 — Messaging + Pitch

17. `routes/messages.py` + frontend
18. `routes/pitch.py` (integrated into messages)

\---

## Verification Plan

### Automated Tests

* Start the Flask server with `python app.py`
* Use the browser tool to register users of each role, login, and test each feature flow

### Manual Verification

* Register a professor, coordinator, and student
* Professor posts a project with custom questions
* Student applies with answers
* Professor reviews the application
* Coordinator posts an announcement
* Student showcases a project
* All users post to the social feed
* Messaging between users
* Global search across users and projects

\---

## Open Questions

> \\\[!IMPORTANT]
> \\\*\\\*MySQL Connection\\\*\\\*: Do you have MySQL installed and running locally? If not, I can use \\\*\\\*SQLite\\\*\\\* instead for easier setup (no installation needed). The SQLAlchemy models work identically with both — we can switch to MySQL later with a one-line config change.

> \\\[!NOTE]
> \\\*\\\*File Uploads\\\*\\\*: Resumes (PDF) and project showcases (ZIP) will be stored on the local filesystem in an `uploads/` folder. This is standard for a college project. Sound good?

