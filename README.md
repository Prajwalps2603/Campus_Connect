Campus Connect
===============

A lightweight social + learning platform for college students. It combines social feed features (posts, follows, notifications) with an EduHub where students can upload and share Notes and Projects, a notebook-style editor with code execution support, and a clean dark-themed UI.

Why this project matters
------------------------
- Brings study resources, project portfolios, and campus social interactions into a single lightweight web app.
- Focused on simplicity: plain HTML/CSS/JS frontend, Node.js/Express backend, and PostgreSQL for persistence.
- Extensible: supports file uploads, JWT authentication, and a pluggable code-execution pathway.

High-level architecture
-----------------------
- Frontend: static HTML pages in the `Frontend/` folder (no framework).
  - Key pages: `index.html` (login/feed), `eduhub.html` (notes/projects upload & browse), `notes-projects.html`, `workbook.html` (editor / word-processor features).
  - Styling: multiple CSS files (e.g., `eduhub.css`, `notes-projects.css`, `style.css`) with a new dark-gradient theme.
  - Client JS: vanilla ES6 JavaScript files (e.g., `script.js`, `eduhub.js`, `advanced-word-processor.js`).

- Backend: `backend/` folder with an Express server (`server.js`) and auth routes in `routes/auth.js`.
  - Uses `pg` to connect to PostgreSQL, `multer` for file uploads, `jsonwebtoken` for JWT auth, and `bcryptjs` for password hashing.
  - Stores uploaded files in `backend/uploads` and serves them statically.

- Database: PostgreSQL with tables for users, posts, follows, notifications, institutions, and new tables `notes` and `projects` that persist user-submitted resources.

Core data model (important tables)
----------------------------------
- users: id, username, email, password_hash, profile fields
- notes: id, user_id, title, description, filename (nullable), filepath, created_at
- projects: id, user_id, title, description, filename (nullable), filepath, created_at
- posts/follows/notifications: existing social features (see `backend/server.js` and `routes/auth.js`).

Key API endpoints (summary)
---------------------------
- Auth
  - POST /api/signup  — create new user
  - POST /api/login   — returns JWT token
  - GET  /api/me      — returns profile for current token
  - GET  /api/verify-token — token validation

- Notes & Projects (new)
  - POST /api/notes    — (auth + multipart) create a note with optional file
  - GET  /api/notes    — list notes (joined with username)
  - POST /api/projects — (auth + multipart) create a project with optional file
  - GET  /api/projects — list projects (joined with username)

- File serving: uploaded files served from `/uploads` static path by the Express server.

Frontend usage flow
-------------------
1. User signs up or logs in (frontend stores a JWT token in localStorage).
2. Authenticated users open `eduhub.html` and use the Upload modal to submit Notes or Projects. The upload form posts multipart/form-data to the appropriate endpoint with a Bearer token header.
3. The EduHub page loads resources via GET /api/notes and GET /api/projects and renders them in carousels and categorized lists.
4. Uploaded files are stored in `backend/uploads` and can be downloaded or previewed by other users.

Unique selling points / Differentiators
-------------------------------------
- Single-file-stack simplicity: easy to understand and extend because the frontend is static and the server is plain Express with SQL.
- EduHub: native upload + categorization for Notes and Projects, displayed in a modern carousel-style UI.
- Notebook / advanced word-processor features: includes a lightweight editor with code execution support integration (JS runs client-side; non-JS languages use an external code-execution API path).
- Focus on student workflows: combines social feed and resource-sharing (notes/projects) in one place.

Security & important warnings
-----------------------------
- JWT secret and DB credentials: ensure `.env` is configured (do not commit secrets).
- JDoodle / code-execution keys: I found a JDoodle configuration in `Frontend/advanced-word-processor.js`. Never place API client secrets in client-side code — move them behind the backend or use a proxy endpoint that hides secrets.
- File uploads: validate file types and sizes server-side to avoid malicious uploads and disk exhaustion.

New: The repository now includes a backend proxy endpoint to execute code securely without exposing provider keys. Configure these environment variables in your `.env` file before starting the server:

- `CODE_EXEC_PROVIDER=jdoodle` (default)
- `JD_CLIENT_ID=your_jdoodle_client_id`
- `JD_CLIENT_SECRET=your_jdoodle_client_secret`

Use `POST /api/execute` with a JSON body { language, script, stdin?, versionIndex? } and include Authorization Bearer token if required. The backend forwards the request to JDoodle and returns the provider response. This keeps API keys server-side and reduces the risk of key leakage.

Security enhancements added:
- Rate limiting: basic request rate limiting applied to `/api/*` (configurable in `server.js`).
- Role-based access control: users have a `role` (default `student`) and a `requireRole` helper is available for protected routes (`teacher`, `admin`, etc.). Roles are included in signed JWTs.
- Refresh tokens: the backend now persists refresh tokens in a `refresh_tokens` table. On successful login/signup the server issues a refresh token (HttpOnly cookie and response body). Use `POST /api/token/refresh` to rotate and obtain new access tokens. Use `POST /api/token/revoke` to invalidate a refresh token.

Developer notes:
- Install new backend dependencies after pulling changes:

```bat
cd backend
npm install
```

- Environment variables to configure for token behavior:
  - `REFRESH_TOKEN_EXPIRES_DAYS` (default 7)

Testing refresh endpoint (example using curl):

```bat
# assuming you have a refresh token in variable %REFRESH%
curl -X POST http://localhost:8000/api/token/refresh -H "Content-Type: application/json" -d "{\"refreshToken\": \"%REFRESH%\"}"
```

Known issues & troubleshooting
-----------------------------
- Port conflicts: during development the server previously ran into "EADDRINUSE" on port 5000. If you see this, either stop the process using that port or set PORT in environment variables to an unused port.
- Token key inconsistency: different frontend files use different localStorage keys like `token` vs `authToken`. Normalize to a single key to avoid forced re-login behavior.
- Unexpected non-JSON responses: typically caused when frontend fetches reach a non-running server — verify the backend is running before testing frontend fetches.

Developer checklist / TODO (recommended short list)
--------------------------------------------------
1. Standardize localStorage token key across all frontend JS files (pick `authToken` or `token`).
2. Move any third-party API keys (JDoodle) to the backend and provide a secure proxy endpoint.
3. Add server-side validation and upload size limits in `server.js` (multer limits and file type checks).
4. Add a small README (this file) and expand with local run instructions & environment variable examples.
5. Add basic tests and a quick CI action (lint + start server smoke test + run a couple endpoint checks).
6. Consider adding pagination to GET /api/notes and /api/projects when the dataset grows.

Edge cases and failure modes to consider
--------------------------------------
- Unauthenticated uploads: ensure endpoints return 401 and the frontend handles redirection to login gracefully.
- Database down or connection errors: return 5xx responses and surface helpful client errors.
- Very large files: enforce server-side limits to avoid memory/disk issues.
- Simultaneous uploads: ensure the server's storage naming avoids collisions (multer uses unique filenames but confirm).

How to explain the project to others (elevator pitch + talking points)
-------------------------------------------------------------------
Elevator pitch (1 sentence):
Campus Connect is a compact student-focused web app that pairs a social feed with an EduHub for sharing notes and projects, making it easy for classmates to discover and reuse learning resources.

Talking points (30–60 seconds):
- It blends social features (posts, follows, notifications) with a curated resource hub for notes and project artifacts.
- The front-end is lightweight and easy to extend (vanilla HTML/CSS/JS) while the backend is a standard Express + PostgreSQL stack — ideal for quick demos and teaching.
- Unique features include client-side notebook/word-processor editing with optional remote code execution for non-JS languages, plus direct uploads that persist to the DB and are displayed in categorized carousels.
- Ready for improvement: secure the code-execution flow, harden uploads, and add pagination and search to scale the resource hub.

Next steps I can help with right away
-------------------------------------
- Standardize the token key across frontend files and update places that expect `token` vs `authToken`.
- Move JDoodle or any code-execution secret to the backend and add a proxy endpoint.
- Add server-side upload validation and size limits (multer options).
- Create a short run/dev guide with exact commands and `.env.example`.

If you'd like, I can implement any of the above changes now (for example, standardize token usage across all frontend scripts, or add multer file-size limits). Tell me which task you want me to take and I'll make the code changes and run a quick validation.

Short project artifacts created/edited during recent work
---------------------------------------------------------
- backend/server.js — added tables `notes` and `projects`, implemented upload endpoints and static serving of `/uploads`.
- Frontend/eduhub.html, Frontend/eduhub.css, Frontend/eduhub.js — added EduHub upload modal, dark gradients, and dynamic load of notes/projects.
- Frontend/advanced-word-processor.js — contains code-execution integration (JDoodle) — move secrets server-side.

Completion summary
------------------
This README summarizes how Campus Connect works, how the pieces interact, unique strengths, and important security/troubleshooting notes. If you want, I can now:
- Normalize token usage across front-end files,
- Move JDoodle usage behind the backend,
- Add server-side upload validation,
- Or make a runnable dev guide with .env.example and explicit commands.

Tell me which of the next steps you'd like me to take and I'll make the changes and validate them.
