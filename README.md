# College Project Hub

A beginner-friendly, full-stack college collaboration web application.

## Tech Stack
- **Frontend**: Vanilla HTML, CSS, JavaScript (served directly by Flask)
- **Backend**: Flask (Python)
- **Database**: SQLite using SQLAlchemy ORM (zero setup, preconfigured)
- **Auth**: JWT (JSON Web Tokens) with a registration/login system supporting 3 distinct roles (Students, Club Coordinators, Professors).

---

## Single Server Architecture (No "Two Servers" Needed!)
Unlike many modern stacks (e.g. React + Node) which require running a separate Frontend Dev Server (like Vite) and a separate Backend API Server, **this project runs on a single unified Flask server**. 

Flask handles both:
1. Serving the static HTML, CSS, and JavaScript files to your browser.
2. Handling the backend REST API endpoints (`/api/register`, `/api/login`, `/api/projects`, etc.) and database queries.

---

## How to Run the Application

### 1. Install Dependencies
Make sure you have Python installed. Open your terminal (PowerShell, Command Prompt, or VS Code terminal) in the project directory (`C:\Users\dewan\Desktop\project`) and run:

```bash
pip install -r requirements.txt
```

*Note: If you get a permission error, you can run: `pip install -r requirements.txt --user`.*

### 2. Run the Application
Start the unified Flask server by running:

```bash
python app.py
```

### 3. Open in Browser
Once the server starts, open your web browser and navigate to:
```
http://127.0.0.1:5000
```

---

## Project Structure & Features
- **Landing / Auth** (`index.html`): Register with dynamic fields based on roles (CPI, Resume PDF for students/coordinators, Club Name for coordinators).
- **Dashboard** (`dashboard.html`): View real-time stats and get quick actions based on your role.
- **Projects** (`projects.html`): 
  - Professors & Coordinators can post project openings with custom questions.
  - Students/Coordinators can browse, apply, submit questionnaire answers, and view project details.
  - Owners can view applications, download resumes, and accept/reject applicants.
- **Announcements** (`announcements.html`): Club coordinators post announcements; all roles can browse them.
- **Showcase** (`showcase.html`): Students can upload a ZIP of their project code and a description to showcase their completed projects.
- **Social Feed** (`feed.html`): Share updates, thoughts, and achievements in a LinkedIn-style public timeline.
- **Messages** (`messages.html`): 1-on-1 private messaging + Pitching ideas directly to professors/coordinators.
- **Search** (`search.html`): Global case-insensitive search to find professors, coordinators, students, or project openings.
