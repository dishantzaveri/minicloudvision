# NetWatch — Network Operations Dashboard

NetWatch is a full-stack network operations dashboard built with **React + TypeScript + Vite** on the frontend and **Flask + SQLAlchemy + SQLite** on the backend. It is inspired by modern network monitoring platforms and is designed to showcase clean full-stack engineering, polished UI, API design, and realistic network operations workflows.

## Overview

NetWatch gives a network operations team one place to monitor device health, inspect topology, manage inventory, and view per-device telemetry. The project includes a full-screen dashboard, an interactive SVG topology map, searchable device management, and live-style metrics for CPU, memory, uptime, and interfaces.

## Features

- Modern full-screen network operations dashboard
- Summary cards for total devices, online coverage, alerts, and unhealthy devices
- Interactive SVG topology graph with draggable nodes
- Searchable device inventory table
- Add and delete device workflows
- Per-device telemetry panel with CPU, memory, uptime, and interface stats
- Flask REST API with clean route separation
- SQLite database with seeded sample network data
- Vite proxy from frontend `/api` requests to Flask backend

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- CSS custom design system
- SVG topology rendering

### Backend

- Python
- Flask
- Flask-SQLAlchemy
- SQLite
- Flask-CORS

## Project Structure

```txt
minicloudvision/
├── backend/
│   ├── app.py
│   ├── models.py
│   ├── seed_data.py
│   ├── requirements.txt
│   ├── instance/
│   └── routes/
│       ├── devices.py
│       ├── links.py
│       └── stats.py
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api/
│       │   └── client.ts
│       ├── components/
│       │   ├── StatCards.tsx
│       │   ├── DeviceTable.tsx
│       │   ├── TopologyGraph.tsx
│       │   ├── StatsPanel.tsx
│       │   └── DeviceModal.tsx
│       ├── hooks/
│       │   └── useData.ts
│       └── types/
│           └── index.ts
│
└── README.md
```

## Getting Started

### Prerequisites

Make sure you have:

- Python 3.10+
- Node.js 18+
- npm
- Git

## Backend Setup

From the project root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

The backend runs on:

```txt
http://localhost:5000
```

You can test the API directly:

```txt
http://localhost:5000/api/devices
http://localhost:5000/api/summary
```

## Frontend Setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs on:

```txt
http://localhost:5173
```

If Vite picks another port, open the exact URL shown in the terminal.

## Build

From the frontend folder:

```bash
npm run build
```

This creates the production build in:

```txt
frontend/dist/
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/devices` | List all devices |
| POST | `/api/devices` | Create a device |
| PUT | `/api/devices/:id` | Update a device |
| DELETE | `/api/devices/:id` | Delete a device and related links |
| GET | `/api/links` | List topology links |
| POST | `/api/links` | Create a topology link |
| DELETE | `/api/links/:id` | Delete a topology link |
| GET | `/api/summary` | Get dashboard summary metrics |
| GET | `/api/devices/:id/stats` | Get telemetry for one device |

## Notes for Local Development

### Stop Vite Correctly

Use:

```bash
Ctrl + C
```

Do not use `Ctrl + Z`, because it only suspends the process and can leave ports stuck.

### If Port 5000 Is Busy on macOS

macOS AirPlay Receiver may use port `5000`. Check the port with:

```bash
lsof -i :5000
```

Kill an old Python server if needed:

```bash
kill -9 <PID>
```

Or disable AirPlay Receiver:

```txt
System Settings → General → AirDrop & Handoff → AirPlay Receiver → Off
```

### If Vite/Rollup Fails on Apple Silicon

If you see a Rollup optional dependency error, reinstall frontend dependencies:

```bash
cd frontend
rm -rf node_modules package-lock.json dist
npm cache clean --force
npm install
npm run build
```

If needed:

```bash
npm install -D @rollup/rollup-darwin-arm64
npm run build
```

## Why This Project Matters

NetWatch demonstrates practical full-stack engineering through a realistic network operations product. It combines frontend state management, TypeScript typing, backend REST APIs, database modeling, interactive visualization, and a polished dashboard UI. It is built to be easy to demo, explain, and extend.

## Future Improvements

- Edit-device workflow
- Toast notifications
- Authentication and roles
- WebSocket-based live telemetry
- Alert history
- Topology auto-layout
- Docker-based deployment
- CSV export for device inventory

## Author

Built by **Dishant Zaveri** as a full-stack network operations dashboard project.
