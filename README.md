# NetWatch — Network Operations Dashboard

NetWatch is a full-stack network operations dashboard built to feel like the kind of internal tool a network team would actually use. The idea was simple: give operators one place to monitor device health, inspect topology, manage inventory, and drill into per-device telemetry without jumping across multiple screens.

I built this project as an interview-focused engineering project, but I deliberately treated it like a real software system instead of a one-off demo. That meant not just building the UI and API, but also adding backend tests, frontend tests, CI, Docker support, and cloud deployment.

---

## Why I Built It

A lot of portfolio projects stop at CRUD. I wanted something that felt closer to infrastructure software and internal tooling. Since networking platforms and operations dashboards are highly relevant to infrastructure companies, I decided to build a NOC-style dashboard that combines:

- operational visibility
- full-stack product design
- realistic data modeling
- deployment and testing discipline

The result is NetWatch.

---

## What the App Does

NetWatch helps a network team quickly answer questions like:

- How many devices are healthy right now?
- Which nodes are online, degraded, or offline?
- What does the network topology look like?
- Which device needs attention?
- What is the CPU, memory, uptime, and interface status of a selected device?
- Can we add, inspect, and remove managed devices from one dashboard?

---

## Main Features

### Dashboard Overview

The dashboard gives a fast operational snapshot through summary cards and a live network view.

It includes:

- total monitored devices
- online coverage percentage
- open alerts
- devices needing attention
- quick health overview of the network fabric

### Interactive Topology View

The topology view renders devices and links visually so a user can inspect the network as a graph instead of a plain table.

It supports:

- SVG-based node and link rendering
- device health color coding
- bandwidth labels on links
- drag-and-drop node repositioning
- persisted node layout using backend coordinates

### Device Inventory Table

The inventory panel makes it easy to manage devices in one place.

It supports:

- device listing
- search and filtering
- selection for telemetry drill-down
- delete actions
- add-device modal workflow

### Per-Device Telemetry Panel

When a device is selected, the app shows a deeper health view.

It includes:

- uptime
- CPU usage
- memory usage
- health score
- interface count
- per-interface RX and TX values
- interface error counts

### Add Device Workflow

The app includes a modal form for creating devices with backend validation for required fields.

---

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- CSS-based custom UI system
- Vitest
- React Testing Library

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- SQLite
- pytest
- pytest-cov
- Gunicorn for production serving

### DevOps / Platform

- GitHub Actions for CI
- Docker
- Docker Compose
- Render for backend deployment
- Vercel for frontend deployment

---

## Project Structure

```text
minicloudvision/
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── seed_data.py
│   ├── instance/
│   ├── routes/
│   │   ├── devices.py
│   │   ├── links.py
│   │   └── stats.py
│   └── tests/
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── vitest.config.ts
│   ├── nginx.conf
│   ├── Dockerfile
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       ├── components/
│       ├── hooks/
│       ├── test/
│       └── types/
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## Backend Design

The backend uses the Flask application factory pattern so configuration can be overridden cleanly for testing and deployment.

### Key backend ideas

#### Application factory

The app is created through `create_app(...)` instead of being hardcoded everywhere. That made it much easier to:

- override database config in tests
- disable seed data in tests
- keep deployment config flexible

#### Blueprints

Routes are split by responsibility:

- `routes/devices.py`
- `routes/links.py`
- `routes/stats.py`

That keeps the backend modular instead of turning `app.py` into one giant file.

#### Database models

There are two main models.

**Device** represents a network node and stores:

- hostname
- IP address
- device type
- model
- OS version
- location
- status
- topology position (`pos_x`, `pos_y`)
- created timestamp

**Link** represents a network connection and stores:

- source device
- target device
- link type
- bandwidth

A nice detail here is that topology coordinates are stored in the database so the graph layout persists after a refresh.

#### Auto-seeding

If the database is empty, the backend seeds sample devices and links so the UI is useful on first run.

---

## API Overview

### Device routes

- `GET /api/devices` → list devices
- `GET /api/devices/<id>` → fetch one device
- `POST /api/devices` → create a device
- `PUT /api/devices/<id>` → update a device
- `DELETE /api/devices/<id>` → delete a device and related links

### Link routes

- `GET /api/links` → list topology links
- additional link endpoints can be extended later if needed

### Stats routes

- `GET /api/summary` → dashboard summary data
- `GET /api/devices/<id>/stats` → per-device telemetry

---

## Frontend Design

I wanted the frontend to feel closer to a real operational dashboard than a standard student CRUD project.

### Main UI pieces

#### App shell

The app has a proper shell with:

- persistent sidebar navigation
- full-width dashboard content area
- responsive layout
- top-level action and status area

#### Stat cards

These show quick business-critical metrics such as:

- devices monitored
- online coverage
- needs attention
- open alerts

#### Topology graph

The topology view is implemented with SVG so it stays lightweight and flexible.

#### Device table

The table gives a practical operational view with selection, search, and delete workflows.

#### Stats panel

The selected-device panel shows telemetry in a compact but readable format.

#### Modal workflow

Adding a device happens through a modal with both frontend and backend validation.

---

## UI / UX Work

After getting the first version working, I did a major polish pass to improve presentation quality.

That included:

- better spacing and hierarchy
- a more premium dark dashboard theme
- stronger card and panel structure
- improved readability for telemetry blocks
- a fuller, more screen-aware layout
- a cleaner topology workspace
- a more demo-ready visual style overall

The goal was to make the project feel manager-demo ready, not just technically correct.

---

## Testing

I wanted the project to be testable, not just manually clickable.

### Backend testing

Backend tests use `pytest` and Flask’s test client.

I added tests for:

#### Smoke tests

- app factory exists
- testing flag works correctly

#### Read tests

- `GET /api/devices` returns 200
- `GET /api/devices` returns a list
- `GET /api/summary` returns 200
- `GET /api/summary` returns expected keys
- summary values are integers

#### Write tests

- device creation returns success
- device creation returns JSON
- created device includes expected fields
- created device includes a generated ID

#### Delete tests

- create then delete lifecycle works
- delete returns the device count to expected value
- deleting an unknown device does not incorrectly return success

### Test isolation

One of the most important backend improvements was moving to isolated test databases.

Initially, repeated write tests polluted the shared database and triggered unique constraint failures on hostnames. I fixed that by:

- updating the app factory to accept test config
- using a temporary SQLite database per test
- skipping seed data during tests
- tearing down the database after each test

That made the test suite repeatable and much more realistic.

### Frontend testing

Frontend tests use:

- Vitest
- React Testing Library
- jsdom

I started with a focused component test around `StatCards` so the test runner, environment, and CI integration were all set up correctly before expanding coverage.

---

## CI Pipeline

I added GitHub Actions so every push gets validated automatically.

### Backend CI job

- checks out the repo
- sets up Python
- installs backend dependencies
- runs `pytest -v`

### Frontend CI job

- checks out the repo
- sets up Node
- installs dependencies with `npm ci`
- runs frontend tests
- runs frontend build

This gave the project a proper quality gate instead of depending only on manual verification.

---

## Docker Setup

I also containerized the project so it can run in a more reproducible environment.

### Backend Docker

The backend container:

- uses a Python slim base image
- installs requirements
- copies backend code
- exposes port 5000
- runs the Flask app

A `.dockerignore` keeps the build clean by excluding things like local virtualenvs, test caches, and SQLite files.

### Frontend Docker

The frontend container uses a multi-stage build.

#### Stage 1

- builds the React app with Node

#### Stage 2

- serves the built output with Nginx

This is cleaner than shipping the full Node build environment in production.

### Docker Compose

Using Docker Compose, both services can be started together locally so the full stack behaves closer to a deployed setup.

---

## Deployment

### Backend deployment

The backend is deployed on Render as a Python web service.

Important deployment work included:

- adding Gunicorn
- using `gunicorn app:app` as the start command
- making the app bind to `0.0.0.0`
- reading the port from the `PORT` environment variable
- using environment variables for database configuration
- fixing SQLite path issues for the free hosting environment
- using `/api/summary` as the health check path

### Frontend deployment

The frontend is deployed on Vercel.

Important frontend deployment work included:

- selecting `frontend` as the root directory in a monorepo setup
- making the frontend read its API base URL from `VITE_API_BASE_URL`
- configuring the environment variable to point at the Render backend
- redeploying after env var setup so the built frontend used the correct backend URL

---

## Key Engineering Problems I Solved

This project became a lot stronger because of the debugging and engineering issues I had to solve along the way.

### Local frontend bootstrapping issues

I fixed issues around:

- missing or misplaced `index.html`
- missing React entry file
- wrong ReactDOM import style
- Vite root and file structure issues
- localhost 404 problems

### TypeScript and testing issues

I fixed issues around:

- missing React/JSX type handling
- test globals not recognized by TypeScript
- build failures caused by Vitest setup
- stale lockfile problems in CI

### Backend test pollution

I moved from ad hoc writes to isolated test databases.

### Docker networking

I fixed the common container problem where Flask was listening on `127.0.0.1` instead of `0.0.0.0`, which made the service unreachable from outside the container.

### Deployment environment configuration

I debugged:

- Render startup issues
- SQLite file path issues on free hosting
- wrong health check path
- Vercel monorepo root-directory configuration
- missing frontend environment variables

---

## Running the Project Locally

## 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install -r requirements-dev.txt
python3 app.py
```

The backend runs on:

```text
http://localhost:5000
```

Useful endpoints:

```text
http://localhost:5000/api/devices
http://localhost:5000/api/summary
```

## 2. Frontend

Open a second terminal.

```bash
cd frontend
npm install
npm run dev
```

Vite usually runs on:

```text
http://localhost:5173
```

If that port is busy, it may move to another nearby port.

---

## Running Tests

### Backend tests

```bash
cd backend
source venv/bin/activate
pytest -v
```

### Frontend tests

```bash
cd frontend
npm run test
```

### Frontend production build

```bash
cd frontend
npm run build
```

---

## Running with Docker

### Backend only

```bash
cd backend
docker build -t netwatch-backend .
docker run --rm -p 5000:5000 netwatch-backend
```

### Frontend only

```bash
cd frontend
docker build -t netwatch-frontend .
```

### Full stack

```bash
docker compose up --build
```

---

## CI / GitHub Actions

The CI workflow lives under:

```text
.github/workflows/ci.yml
```

It runs on pushes and pull requests to validate both backend and frontend.

---

## What I’d Improve Next

If I kept extending the project, the next steps would be:

- move persistence from SQLite to PostgreSQL
- add authentication and role-based access
- expand frontend test coverage
- add edit-device workflow
- add live telemetry streaming with WebSockets
- add alert history and incident timeline features
- improve topology grouping and filtering
- add better production observability and monitoring

---

## Why This Project Matters

This project is valuable because it goes beyond a pretty UI or a simple REST API.

It shows:

- full-stack ownership
- realistic domain modeling
- API design
- frontend architecture
- testing discipline
- CI setup
- Dockerization
- deployment debugging
- iterative product thinking

That full journey is really the point of the project.

---

## Interview Summary

If I had to summarize the project in one line:

**NetWatch is a full-stack network operations dashboard that I built end-to-end, then took through testing, CI, Docker, and deployment so it behaves like a real engineering project rather than just a local demo.**

