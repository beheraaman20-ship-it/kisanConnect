# KisanConnect — How to Run Everything

This project has **4 moving parts**. This guide shows how to run them all together.

> **Windows note:** Controlled Folder Access blocks Java **and Python** from writing inside
> `Documents` (the default protected folder). Because of that, the projects that use Java/Python
> for writes must live on `C:\` and run from there. Node (backend + admin) can run from
> `Documents`. Details per component below.

---

## Ports & services

| Component | Tech | Port | Source of truth |
|---|---|---|---|
| Backend API | Node + Express + Socket.IO | **4000** | `C:\KisanConnectBackend` |
| ML service | FastAPI (uvicorn) | **8001** | `C:\KisanConnectML` |
| Admin dashboard | Vite + React (TS) | **5173** | `admin/` |
| Farmer web app | Vite + React (TS) | **5174** | `web/` |
| Mobile app | React Native 0.73 (NOT Expo) | Metro 8081 | `mobile/` (build = `C:\KisanConnectMobile`) |

Shared database: **SQLite** at `C:\KisanConnectBackend\data\kisanconnect.db`
(backend writes it; ML reads the same file directly).

---

## 1. Backend — port 4000

Lives at `C:\KisanConnectBackend` (copy of the original `Backed/`, moved out of Documents so the
Python ML service can access the SQLite DB file).

```bash
cd C:\KisanConnectBackend
npm install          # only once
npm run dev          # or: npm start
```

- Seeds demo data automatically when the DB is empty (`src/config/seed.js`).
- Health check: http://localhost:4000/health
- API base: http://localhost:4000/api/v1
- Config lives in `.env` (PORT=4000, DB_DRIVER=sqlite, ML_SERVICE_URL=http://localhost:8001).

### Keep source in sync
The canonical source is `Documents\kisanConnect\Backed`. When you edit backend code there, copy
it to `C:\KisanConnectBackend` before running:

```powershell
Copy-Item C:\Users\bidut\Documents\kisanConnect\Backed\* C:\KisanConnectBackend\ -Recurse -Force
```

---

## 2. ML service — port 8001

Lives at `C:\KisanConnectML` (copy of the original `Ml/`). Uses its own virtualenv at
`C:\KisanConnectML-venv`.

```bash
cd C:\KisanConnectML
C:\KisanConnectML-venv\Scripts\python.exe -m pip install -r requirements.txt   # only once
C:\KisanConnectML-venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

- Health check: http://localhost:8001/health
- Endpoints:
  - `POST /api/v1/wait-time/predict`
  - `POST /api/v1/centers/recommend`
  - `GET  /api/v1/centers/recommendations?lat=..&lng=..`
  - `POST /api/v1/admin/ml/train/wait-time` (retrain from the live DB)
- Reads the backend DB directly: `DATABASE_URL=sqlite:///C:/KisanConnectBackend/data/kisanconnect.db`
  (set in `app/core/config.py` / `.env`). Models save to `saved_models/` in this folder.

### How it's wired to the backend
When `ML_SERVICE_URL` is set (it is, in the backend `.env`), the backend calls the ML service for
**center wait-time estimates** (`/wait-time/predict`) and for **center recommendations**
(`/centers/recommend`). If the ML service is down, the backend silently falls back to its built-in
heuristic (`src/ml/waitTime.js`, `src/ml/recommendation.js`).

---

## 3. Admin dashboard — port 5173

Runs from `Documents\kisanConnect\admin`.

```bash
cd C:\Users\bidut\Documents\kisanConnect\admin
npm install          # only once
npm run dev          # http://localhost:5173
```

- Vite dev server proxies `/api` to **http://localhost:4000** (the backend) — see `vite.config.ts`.
- Build: `npm run build` (tsc + vite). Verified passing.

---

## 4. Farmer web app — port 5174

React (Vite) port of the mobile farmer app. Lives in `Documents\kisanConnect\web`.

```bash
cd C:\Users\bidut\Documents\kisanConnect\web
npm install          # only once
npm run dev          # http://localhost:5174
npm run typecheck    # tsc --noEmit
npm run build        # tsc + vite build (dist/)
```

- Vite dev server proxies `/api` → **http://localhost:4000** and `/socket.io` (websocket) → backend.
- API base is relative (`/api/v1`) so it works through the dev proxy; overridable via
  `web/.env` (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`).
- Routes: `/login`, `/otp`, `/` (home), `/centers/:centerId`, `/centers/:centerId/schedule`,
  `/centers/:centerId/book`, `/.../book/confirmation`, `/queue`, `/bookings`, `/notifications`,
  `/profile`.

---

## 5. Mobile app (farmer) — React Native 0.73

This is **bare React Native, NOT Expo**. Do not use `npx expo start`.

Because Gradle/Java cannot write inside `Documents`, install the app deps and run the Android
build from the copy at `C:\KisanConnectMobile`:

```bash
# first time (in the C:\ copy)
cd C:\KisanConnectMobile
npm install
cd android
gradlew assembleDebug     # outputs app-debug.apk
```

Run on an emulator / device:

```bash
cd C:\KisanConnectMobile
npm start                 # starts Metro on port 8081
npm run android           # builds + launches on the connected Android device/emulator
```

- API base URL: `http://localhost:4000/api/v1` and Socket.IO at `http://localhost:4000`
  (`src/core/config/env.ts`, overridable via `.env`).
- On a **physical device**, `localhost` refers to the phone — set
  `API_BASE_URL=http://<your-PC-LAN-IP>:4000/api/v1` in `mobile/.env` instead.
- Source lives in `Documents\kisanConnect\mobile`; the working build copy is `C:\KisanConnectMobile`.

---

## 6. One-shot: start backend + ML (both detached)

From any PowerShell (services keep running after the window closes):

```powershell
$r1 = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd /c cd /d C:\KisanConnectBackend && node src\app.js > C:\Users\bidut\AppData\Local\Temp\opencode\backend.out.log 2> C:\Users\bidut\AppData\Local\Temp\opencode\backend.err.log' }
$r2 = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd /c cd /d C:\KisanConnectML && C:\KisanConnectML-venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8001 > C:\Users\bidut\AppData\Local\Temp\opencode\ml.out.log 2> C:\Users\bidut\AppData\Local\Temp\opencode\ml.err.log' }
```

Same trick for the web dev server (invoke vite's node bin directly — `npm` adds an npm process
that gets killed, so call `node node_modules\vite\bin\vite.js` instead):

```powershell
$r3 = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd /c cd /d C:\Users\bidut\Documents\kisanConnect\web && node node_modules\vite\bin\vite.js --port 5174 > C:\Users\bidut\AppData\Local\Temp\opencode\vite.out.log 2> C:\Users\bidut\AppData\Local\Temp\opencode\vite.err.log' }
```

Verify with `Invoke-RestMethod http://localhost:4000/health` and
`Invoke-RestMethod http://localhost:8001/health`.
For the web app: open http://localhost:5174 (dev server proxies API + Socket.IO to the backend).

---

## 7. Smoke-test the full chain

```powershell
# 1) Need: backend + ML running

# 2) Backend calls ML for wait-time estimates (per center)
Invoke-RestMethod http://localhost:4000/api/v1/centers

# 3) Backend calls ML for center recommendations (rank, score, model_version come from ML)
Invoke-RestMethod "http://localhost:4000/api/v1/centers/recommendations?lat=30.90&lng=75.85"

# 4) ML reads the same SQLite DB the backend uses
Invoke-RestMethod "http://localhost:8001/api/v1/centers/recommendations?lat=30.90&lng=75.85"

# 5) Retrain the wait-time model from live backend data (optional)
Invoke-RestMethod -Method Post http://localhost:8001/api/v1/admin/ml/train/wait-time
```

If `/api/v1/centers/recommendations` shows `model=center_recommend_v1.0`, the backend→ML wiring is live.