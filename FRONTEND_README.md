# KisanConnect — Frontend

The frontend of the **Smart Farmer Procurement Management System** consists of two applications:

1. **`mobile/`** — React Native + TypeScript mobile app for **Farmers**
2. **`admin/`** — React.js + TypeScript web dashboard for **Staff & Admin**

Both are built to consume the backend REST API (`/api/v1`) and real-time Socket.IO events described in `Main_Document-2.md`.

---

## 1. Mobile App (Farmer) — `mobile/`

React Native + TypeScript app that lets farmers book procurement slots, receive digital tokens, and track their live queue position and waiting time.

### Tech Stack

- React Native + TypeScript
- React Navigation (native-stack + bottom-tabs)
- TanStack Query (server state + API caching)
- Zustand (client/auth state)
- Axios (API client)
- Zod (validation)
- React Hook Form (forms)
- AsyncStorage (non-sensitive persistence)
- react-native-keychain (secure token storage)
- Socket.IO Client (live queue updates)
- Firebase Cloud Messaging (push notifications)

### Key Screens

| Screen | File |
|---|---|
| Login (OTP) | `src/features/auth/screens/LoginScreen.tsx` |
| OTP Verify | `src/features/auth/screens/OtpScreen.tsx` |
| Home (nearby centers) | `src/features/farmerProfile/screens/FarmerHomeScreen.tsx` |
| Center Details | `src/features/centers/screens/CenterDetailsScreen.tsx` |
| Schedule / Slot pick | `src/features/centers/screens/ScheduleScreen.tsx` |
| Confirm Booking | `src/features/booking/screens/BookingScreen.tsx` |
| Booking Confirmation + Token | `src/features/booking/screens/BookingConfirmationScreen.tsx` |
| **Live Queue** | `src/features/queue/screens/LiveQueueScreen.tsx` |
| Booking History | `src/features/history/screens/BookingHistoryScreen.tsx` |
| Notifications | `src/features/notifications/screens/NotificationsScreen.tsx` |
| Profile | `src/features/farmerProfile/screens/ProfileScreen.tsx` |

### The Live Queue Screen (core differentiator)

Displays prominently:
```
Your Token: A-125
Current Token: A-118
Position: 7
Estimated Wait: 35 minutes
```
Rendered from server state via REST polling + real-time Socket.IO `queue.updated` events. Handles offline/reconnecting states.

### Run it

```bash
cd mobile
npm install
# Configure API URLs in .env (copy from .env.example)
npm run android   # or npm run ios / npm start
```

> Requires matching native projects (`android/`, `ios/`). Generate them with
> `npx react-native init` baseline or the project export of your RN tooling, then drop `src/` in.

---

## 2. Admin Dashboard (Staff & Admin) — `admin/`

React.js + TypeScript (Vite) dashboard for managing centers, schedules, users, and viewing statistics.

### Tech Stack

- React.js + TypeScript
- Vite (build tool)
- React Router (routing)
- TanStack Query (data fetching)
- Zustand (auth state)
- Recharts (charts)
- Tailwind CSS (styling)
- lucide-react (icons)

### Pages

| Page | Route | File |
|---|---|---|
| Login | `/login` | `src/pages/auth/LoginPage.tsx` |
| Dashboard | `/` | `src/pages/DashboardPage.tsx` |
| Centers | `/centers` | `src/pages/centers/CentersPage.tsx` |
| Schedules | `/schedules` | `src/pages/schedules/SchedulesPage.tsx` |
| Farmers | `/farmers` | `src/pages/farmers/FarmersPage.tsx` |
| Tokens | `/tokens` | `src/pages/tokens/TokensPage.tsx` |
| Procurements | `/procurements` | `src/pages/procurements/ProcurementsPage.tsx` |
| Reports | `/reports` | `src/pages/reports/ReportsPage.tsx` |

### Run it

```bash
cd admin
npm install
npm run dev
# Vite proxies /api to http://localhost:3000 (backend)
```

---

## Branch / Segregation Notes

- **Backend** (`Node.js + Express`), **Database** (`PostgreSQL`), and **ML** service are separate.
- Use `Main_Document-2.md` §30.1 for the exact build order.
- The server is the source of truth for queue position, waiting time, status transitions, and capacity.
