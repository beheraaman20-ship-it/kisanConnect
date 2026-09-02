# Smart Farmer Procurement Management System
## Master Development Document

**Purpose:** Single source of truth for frontend, backend, database, ML/intelligence, notifications, testing, deployment, and SIH demonstration.

---

# 1. Project Overview

The Smart Farmer Procurement Management System is a digital platform designed to reduce waiting time and uncertainty during agricultural procurement.

The core product lets a farmer:
1. Register/login.
2. Find procurement centers.
3. View schedules.
4. Book a procurement slot.
5. Receive a digital token.
6. Track queue position.
7. See estimated waiting time.
8. Follow procurement status.
9. Receive notifications.
10. Complete procurement without unnecessary waiting.

Center staff manage the live queue, verify farmers, inspect produce, record procurement, and update status. Admins manage centers, schedules, users, and statistics.

The source project brief identifies reducing waiting time and uncertainty—not merely booking—as the key innovation. [Source: project README]

---

# 2. Users and Roles

## 2.1 Farmer
- Register/Login
- Farmer profile
- View nearby procurement centers
- View schedules
- Select date/time slot
- Book slot
- Receive digital token
- Track queue
- View estimated waiting time
- Track procurement status
- Receive notifications

## 2.2 Procurement Center Staff
- Staff login
- View today's queue
- Verify farmer
- Manage tokens
- Call next farmer
- Update procurement status
- Record commodity and quantity
- Record quality status
- Complete procurement

## 2.3 Admin
- Admin login
- Manage procurement centers
- Manage schedules
- View farmers
- Monitor procurement
- View statistics

---

# 3. End-to-End Workflow

```text
Farmer Login
    ↓
Select Procurement Center
    ↓
Select Date & Time Slot
    ↓
Book Slot
    ↓
Get Digital Token
    ↓
Track Queue + Estimated Wait
    ↓
Visit Center When Turn Approaches
    ↓
Verification
    ↓
Produce Inspection
    ↓
Procurement
    ↓
Status Updated
    ↓
Procurement Completed
```

---

# 4. Functional Requirements

## 4.1 Authentication
- OTP-based login.
- JWT-based authenticated sessions.
- Role-based access control.
- Farmer, center staff, and admin roles.
- Logout/token invalidation strategy.
- Rate limiting for OTP requests.
- OTP expiry and retry limits.

## 4.2 Farmer App
Recommended screens:
1. Splash
2. Login / OTP
3. Home
4. Profile
5. Nearby Centers
6. Center Details
7. Schedule
8. Slot Booking
9. Booking Confirmation
10. Digital Token
11. Live Queue
12. Procurement Status
13. Notifications
14. Booking History

### Important UI principles
- Simple language and large touch targets.
- Clear status indicators.
- Minimal steps for booking.
- Show current token, farmer token, queue position, and estimated wait prominently.
- Design for intermittent/slow network conditions.

## 4.3 Center Dashboard
Recommended screens:
1. Staff Login
2. Today's Overview
3. Live Queue
4. Farmer Verification
5. Current Farmer
6. Inspection
7. Procurement Entry
8. Completed Records
9. Daily Summary

Center operators should be able to:
- Call next farmer.
- Mark farmer as arrived.
- Verify identity.
- Move token through workflow.
- Enter commodity.
- Enter quantity.
- Enter quality result.
- Complete/reject/reschedule procurement.

## 4.4 Admin Dashboard
Recommended modules:
- Dashboard
- Centers
- Schedules
- Farmers
- Tokens
- Procurements
- Reports/statistics
- User/staff management
- System configuration

---

# 5. Procurement Status State Machine

Primary flow:

```text
BOOKED
  ↓
WAITING
  ↓
VERIFICATION
  ↓
INSPECTION
  ↓
PROCUREMENT
  ↓
COMPLETED
```

Alternative terminal/exception states:

```text
CANCELLED
RESCHEDULED
REJECTED
```

Every status transition should be recorded in an audit/history table so that the system can explain what happened and when.

---

# 6. Recommended Technology Architecture

## 6.1 Mobile Frontend
**React Native + TypeScript**

Recommended stack:
- React Native
- TypeScript
- React Navigation
- TanStack Query for server state and API caching
- Zustand for lightweight client/UI state
- Axios for the central API client
- Zod for runtime validation of API/input data
- React Hook Form for forms
- AsyncStorage for non-sensitive local persistence
- Secure storage for authentication/session secrets
- Socket.IO Client for live queue/status updates
- Firebase Cloud Messaging for push notifications
- Jest + React Native Testing Library for unit/component tests
- Detox for end-to-end mobile testing

Exact structure:

```text
mobile/
├── android/
├── ios/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── AuthNavigator.tsx
│   │   │   ├── FarmerNavigator.tsx
│   │   │   └── types.ts
│   │   └── providers/
│   │       ├── QueryProvider.tsx
│   │       └── AppProviders.tsx
│   │
│   ├── core/
│   │   ├── config/
│   │   │   ├── env.ts
│   │   │   └── appConfig.ts
│   │   ├── constants/
│   │   ├── errors/
│   │   ├── network/
│   │   │   ├── apiClient.ts
│   │   │   ├── interceptors.ts
│   │   │   └── socket.ts
│   │   ├── storage/
│   │   │   ├── secureStorage.ts
│   │   │   └── localStorage.ts
│   │   ├── notifications/
│   │   │   ├── fcm.ts
│   │   │   └── notificationHandlers.ts
│   │   ├── permissions/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── api/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── screens/
│   │   │   ├── store/
│   │   │   ├── types/
│   │   │   └── validation/
│   │   ├── farmerProfile/
│   │   ├── centers/
│   │   ├── booking/
│   │   ├── tokens/
│   │   ├── queue/
│   │   ├── procurement/
│   │   ├── notifications/
│   │   └── history/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── forms/
│   │   ├── feedback/
│   │   └── status/
│   │
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── index.ts
│   │
│   └── assets/
│       ├── images/
│       └── icons/
│
├── __tests__/
├── e2e/
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── app.json
```

Architecture rules:
- Use feature-first architecture.
- Keep screens focused on presentation and orchestration.
- Keep API calls inside feature `api/` modules or shared services.
- Keep server state in TanStack Query; do not duplicate API state in Zustand.
- Use Zustand only for client-side state such as authentication/session metadata, UI preferences, and transient app state.
- Use typed TypeScript models throughout the app.
- Validate important API payloads with Zod.
- Use one central Axios API client.
- Use one Socket.IO client/service for live queue events.
- Persist only essential local data.
- Keep authentication secrets in secure device storage rather than ordinary AsyncStorage.
- Make queue/status UI render from server state and real-time events.
- Build explicit loading, error, empty, offline, and reconnecting states.
- Keep business rules in the backend; the mobile app should not be the source of truth for queue position, capacity, or status transitions.

## 6.2 Backend
**Node.js + Express**

Suggested structure:

```text
backend/
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── models/
│   ├── validators/
│   ├── jobs/
│   ├── realtime/
│   ├── notifications/
│   ├── ml/
│   └── app.js
├── tests/
├── migrations/
└── package.json
```

Layer responsibilities:
- **Routes:** endpoint definitions.
- **Controllers:** request/response handling.
- **Services:** business rules.
- **Repositories:** database access.
- **Validators:** input validation.
- **Middleware:** authentication, authorization, rate limiting, error handling.
- **Jobs:** scheduled/background processing.
- **Realtime:** queue/status updates.
- **ML:** prediction/recommendation services.

## 6.3 Database
**PostgreSQL**

Use migrations from the beginning. Do not modify production schema manually.

## 6.4 Authentication
**OTP + JWT**

JWT should contain:
- user ID
- role
- issued/expiry metadata

Never store OTPs in plaintext in persistent storage.

## 6.5 Notifications
**Firebase Cloud Messaging**

Use notifications for:
- Booking confirmation
- Token generated
- Queue approaching
- Queue/status changes
- Procurement completed
- Cancellation/rescheduling

## 6.6 Admin Dashboard
**React.js**

Recommended structure:

```text
admin/
├── src/
│   ├── pages/
│   ├── components/
│   ├── layouts/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   └── utils/
└── tests/
```

---

# 7. Database Design

The original brief defines Users, Procurement Centers, Slots, Tokens, and Procurement. This master design adds supporting tables needed for a production-ready implementation.

## 7.1 users

```text
id
name
mobile
role
address
district
village
created_at
updated_at
```

## 7.2 procurement_centers

```text
id
name
location
district
latitude
longitude
daily_capacity
status
created_at
updated_at
```

## 7.3 slots

```text
id
center_id
date
start_time
end_time
capacity
available_slots
status
created_at
updated_at
```

## 7.4 tokens

```text
id
token_number
farmer_id
center_id
slot_id
status
queue_position
estimated_wait_time
booked_at
called_at
completed_at
created_at
updated_at
```

## 7.5 procurement

```text
id
token_id
farmer_id
center_id
commodity
quantity
quality_status
procurement_status
payment_status
created_at
updated_at
```

## 7.6 status_history

```text
id
token_id
procurement_id
old_status
new_status
changed_by
reason
created_at
```

## 7.7 notifications

```text
id
user_id
type
title
message
data
read_at
created_at
```

## 7.8 devices

```text
id
user_id
fcm_token
platform
last_seen_at
created_at
```

## 7.9 staff_center_assignments

```text
id
user_id
center_id
created_at
```

## 7.10 audit_logs

```text
id
user_id
action
entity_type
entity_id
metadata
created_at
```

---

# 8. Database Relationships

```text
USER
 ├──< TOKENS
 ├──< NOTIFICATIONS
 ├──< DEVICES
 └──< STAFF_CENTER_ASSIGNMENTS >── PROCUREMENT_CENTER

PROCUREMENT_CENTER
 ├──< SLOTS
 ├──< TOKENS
 ├──< PROCUREMENT
 └──< STAFF_CENTER_ASSIGNMENTS

SLOT
 └──< TOKENS

TOKEN
 ├──< STATUS_HISTORY
 └── 0..1 PROCUREMENT

PROCUREMENT
 └──< STATUS_HISTORY
```

Important constraints:
- A slot belongs to exactly one center.
- A token belongs to one farmer, center, and slot.
- A procurement record belongs to a token.
- Token numbers should be unique within the appropriate center/date context.
- Booking must be transactional to prevent overbooking.

---

# 9. API Specification

Base path:

```text
/api/v1
```

## 9.1 Authentication

```http
POST /auth/send-otp
POST /auth/verify-otp
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

## 9.2 Farmer

```http
GET  /farmers/me
PUT  /farmers/me
GET  /farmers/me/bookings
GET  /farmers/me/procurements
```

## 9.3 Centers

```http
GET /centers
GET /centers/:id
GET /centers/:id/schedule
GET /centers/recommendations
```

## 9.4 Slots / Booking

```http
GET  /slots/:id
POST /slots/book
POST /bookings/:id/cancel
POST /bookings/:id/reschedule
```

## 9.5 Tokens / Queue

```http
GET /tokens/:id
GET /tokens/:id/status
GET /centers/:id/queue
GET /centers/:id/queue/summary
```

## 9.6 Center Operations

```http
GET  /center/queue/today
POST /center/tokens/:id/verify
POST /center/queue/next
PUT  /center/tokens/:id/status
POST /center/tokens/:id/procurement
```

## 9.7 Admin

```http
GET    /admin/dashboard
GET    /admin/farmers
GET    /admin/centers
POST   /admin/centers
PUT    /admin/centers/:id
GET    /admin/schedules
POST   /admin/schedules
PUT    /admin/schedules/:id
GET    /admin/statistics
```

---

# 10. API Response Standard

Use a consistent response shape.

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "SLOT_FULL",
    "message": "The selected slot is no longer available"
  }
}
```

HTTP status codes:
- 200: success
- 201: created
- 400: validation error
- 401: unauthenticated
- 403: unauthorized
- 404: not found
- 409: conflict/booking race
- 429: rate limited
- 500: unexpected server error

---

# 11. Real-Time Queue System

The project's main differentiator is the live queue.

Required displayed information:

```text
Your Token: A-125
Current Token: A-118
Position: 7
Estimated Wait: 35 minutes
```

## Queue rules

When a farmer books:
1. Validate slot availability.
2. Lock/update slot capacity transactionally.
3. Create token.
4. Calculate initial queue position.
5. Calculate estimated wait.
6. Return token details.
7. Notify the farmer.

When staff calls the next farmer:
1. Identify next eligible token.
2. Atomically mark it as called/verification.
3. Recalculate remaining positions.
4. Recalculate estimated waits.
5. Publish real-time queue update.
6. Send relevant notifications.

Avoid relying on client-side calculations for queue position.

---

# 12. Real-Time Communication

Recommended implementation:
- REST APIs for normal CRUD operations.
- WebSocket/Socket.IO layer for live queue/status updates.

Events:

```text
queue.updated
token.called
token.status_changed
procurement.completed
slot.updated
```

Example event:

```json
{
  "event": "queue.updated",
  "centerId": "CENTER_ID",
  "tokenId": "TOKEN_ID",
  "position": 7,
  "estimatedWaitMinutes": 35
}
```

The mobile app should reconnect automatically after network loss.

---

# 13. ML / Smart Features

The source brief emphasizes smart queueing and smart center recommendation but does not specify a particular ML algorithm or training dataset. Therefore, ML implementation should be treated as an extension rather than an assumed completed requirement.

## 13.1 Estimated Waiting Time

### Goal
Predict how long a farmer is likely to wait.

Potential inputs:
- Current queue length.
- Number of active counters/operators.
- Average processing time.
- Historical processing times.
- Slot/time of day.
- Day of week.
- Current number of farmers being processed.
- Historical no-show rate.
- Commodity/inspection complexity, if available.

### MVP
Start with a transparent baseline:

```text
estimated_wait =
    number_of_people_ahead
    × average_processing_minutes
    ÷ active_counters
```

Then replace/improve it with a trained regression model when enough historical data exists.

## 13.2 Smart Center Recommendation

Example:

```text
Center A → 45 farmers → ~120 min wait
Center B → 12 farmers → ~30 min wait

Recommended: Center B
```

Recommendation score can combine:
- Distance.
- Queue size.
- Predicted waiting time.
- Slot availability.
- Center operating status.

A simple weighted ranking can be used before ML data is sufficient.

## 13.3 ML Service Architecture

Keep ML loosely coupled:

```text
Backend
   ↓
ML Service
   ├── wait-time prediction
   └── center recommendation
```

Possible future implementation:
- Python + FastAPI
- scikit-learn/XGBoost or another validated model
- PostgreSQL/feature data source

Do not introduce a separate ML service until the team has enough data or a real performance need.

## 13.4 ML Data Pipeline

```text
Operational Database
       ↓
Data Extraction
       ↓
Cleaning / Validation
       ↓
Feature Engineering
       ↓
Train / Validation Split
       ↓
Model Training
       ↓
Evaluation
       ↓
Model Version
       ↓
Prediction API
       ↓
Backend
       ↓
Farmer / Staff UI
```

Store model version and prediction timestamp so predictions can be audited.

---

# 14. Notification Design

Notification categories:

| Event | Farmer | Staff | Admin |
|---|---|---|---|
| Booking confirmed | Yes | Optional | No |
| Token generated | Yes | Yes | No |
| Queue approaching | Yes | No | No |
| Verification started | Yes | Yes | Optional |
| Inspection started | Yes | Yes | Optional |
| Procurement completed | Yes | Yes | Yes |
| Cancellation | Yes | Yes | Optional |
| Reschedule | Yes | Yes | Optional |

Notifications must never be the only source of truth; the app/dashboard should always display current server state.

---

# 15. Frontend State Model

The farmer app should model booking/token state explicitly.

Example:

```text
BookingState
 ├── Initial
 ├── Loading
 ├── Booked
 ├── Cancelled
 ├── Rescheduled
 └── Error

TokenState
 ├── Booked
 ├── Waiting
 ├── Verification
 ├── Inspection
 ├── Procurement
 ├── Completed
 ├── Rejected
 └── Cancelled
```

The UI should render from server state rather than manually inferring status from screen navigation.

---

# 16. Security Requirements

Minimum requirements:
- HTTPS everywhere outside local development.
- Hash/passwordless OTP handling where applicable.
- JWT expiration.
- Role-based authorization.
- Input validation.
- SQL injection protection through parameterized queries/ORM.
- Rate limiting.
- OTP abuse prevention.
- Secure secret management.
- Audit logs for administrative and procurement actions.
- Do not expose internal database IDs unnecessarily if public token IDs are sufficient.
- Protect farmer personal data.
- Restrict staff access to assigned centers.
- Validate all status transitions server-side.

---

# 17. Concurrency and Data Integrity

This project has a high risk of race conditions around slot booking and queue processing.

## Slot booking
Use a database transaction and row-level locking/atomic capacity update.

Do not:

```text
READ available_slots
↓
if available > 0
↓
INSERT booking
↓
UPDATE available_slots
```

without transactional protection.

Instead, make the availability check and reservation atomic.

## Calling next farmer
Only one operator should be able to claim a token.

Use database transaction/locking so two staff devices cannot process the same farmer simultaneously.

---

# 18. Testing Strategy

## 18.1 Backend
- Unit tests for services.
- API integration tests.
- Authentication tests.
- Authorization tests.
- Booking concurrency tests.
- Queue calculation tests.
- Status-transition tests.
- Notification tests.

## 18.2 React Native
- Component tests with React Native Testing Library.
- Hook/state tests.
- API/repository tests.
- Booking flow test.
- Queue screen test.
- Offline/reconnection test.
- Navigation/authentication flow tests.
- End-to-end tests with Detox.

## 18.3 React
- Component tests.
- Dashboard data tests.
- Role-access tests.
- Queue interaction tests.

## 18.4 ML
- Data validation tests.
- Feature pipeline tests.
- Model evaluation.
- Prediction sanity tests.
- Drift/performance monitoring once deployed.

---

# 19. Observability

Backend should log:
- Request ID.
- User ID where appropriate.
- Endpoint.
- Response status.
- Latency.
- Error code.
- Important business events.

Metrics:
- OTP success/failure.
- Booking success/failure.
- Slot utilization.
- Average waiting time.
- Average processing time.
- Queue length.
- Procurement completion rate.
- Cancellation/reschedule rate.
- Notification delivery/failure.
- API error rate.

---

# 20. Environment Configuration

Use separate environments:

```text
development
staging
production
```

Example environment variables:

```text
NODE_ENV=
PORT=
DATABASE_URL=
JWT_SECRET=
OTP_PROVIDER_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
ML_SERVICE_URL=
```

Never commit real secrets to Git.

Provide:

```text
.env.example
```

with placeholder values.

---

# 21. Repository Structure

Recommended monorepo:

```text
smart-farmer-procurement/
│
├── mobile/
├── backend/
├── admin/
├── ml/
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
├── infra/
├── .github/
│   └── workflows/
├── .env.example
├── README.md
└── docker-compose.yml
```

---

# 22. Development Order

Follow this implementation sequence:

```text
1. Database schema + migrations
        ↓
2. Backend project + authentication
        ↓
3. Center + schedule APIs
        ↓
4. Farmer React Native login/profile
        ↓
5. Slot booking
        ↓
6. Token generation
        ↓
7. Queue management
        ↓
8. Procurement status workflow
        ↓
9. Center dashboard
        ↓
10. Admin dashboard
        ↓
11. Real-time queue updates
        ↓
12. Notifications
        ↓
13. Waiting-time baseline
        ↓
14. Center recommendation
        ↓
15. ML improvements
        ↓
16. Testing + security
        ↓
17. Deployment
        ↓
18. SIH demo preparation
```

---

# 23. Git Workflow

Recommended branches:

```text
main
develop
feature/*
fix/*
hotfix/*
```

Commit examples:

```text
feat: add slot booking API
feat: implement farmer token screen
feat: add live queue updates
fix: prevent duplicate slot booking
test: add queue service tests
docs: update API specification
```

Pull requests should include:
- What changed.
- Why it changed.
- API/schema changes.
- Screenshots for UI changes.
- Tests performed.
- Known limitations.

---

# 24. Definition of Done

A feature is complete only when:
- UI is implemented.
- API is implemented if required.
- Database changes are migrated.
- Validation exists.
- Authorization exists.
- Error states are handled.
- Loading states are handled.
- Tests exist for important business logic.
- Logs/metrics are added where appropriate.
- Documentation is updated.
- Feature works in staging.

---

# 25. MVP Acceptance Criteria

The MVP is successful when one complete scenario works:

```text
Farmer
  ↓
Login
  ↓
Select Center
  ↓
Select Slot
  ↓
Book
  ↓
Receive Digital Token
  ↓
See Queue Position
  ↓
See Estimated Waiting Time
  ↓
Receive Status Updates
  ↓
Center Operator Verifies
  ↓
Inspection
  ↓
Procurement
  ↓
Completed
```

The original MVP goal is that a farmer can book a procurement slot, receive a token, see queue position and estimated waiting time, and receive the final procurement status without unnecessary waiting at the center.

---

# 26. SIH Demonstration Plan

For the final demo, prepare three roles:

### Demo 1 — Farmer
- Login with OTP.
- Choose center.
- Compare center queue/wait.
- Book a slot.
- Receive token.
- Display live queue.
- Show notification/status progression.

### Demo 2 — Center Operator
- Open today's queue.
- Verify farmer.
- Call next farmer.
- Move token through verification → inspection → procurement.
- Enter quantity and quality.
- Complete procurement.

### Demo 3 — Admin
- Show center/schedule management.
- Show live procurement statistics.
- Show queue and operational overview.

The most important visual moment is:

```text
Your Token: A-125
Current Token: A-118
Position: 7
Estimated Wait: 35 minutes
```

followed by a real-time status progression.

---

# 27. Key Product Metrics

Track:
- Average farmer waiting time.
- Average processing time.
- Average queue length.
- Slot utilization.
- Percentage of farmers arriving near their expected turn.
- Cancellation rate.
- Reschedule rate.
- Procurement completion rate.
- Estimated-vs-actual waiting time error.
- Center utilization.

These metrics also become the foundation for future ML training.

---

# 28. Important Scope Boundary

The original project document specified Flutter for the mobile app, Node.js + Express, PostgreSQL, OTP + JWT, Firebase Cloud Messaging, and React.js for the admin dashboard. This revised master document replaces Flutter with React Native + TypeScript for the mobile app. It defines smart queueing and center recommendation as key innovation areas, but it does not provide a specific ML model, dataset, cloud provider, payment integration, or external government procurement API.

Therefore:
- Do not claim these integrations already exist.
- Build the MVP around the explicitly defined workflow.
- Add ML after collecting sufficient operational data.
- Keep external integrations behind interfaces so they can be added later.

---

# 29. Master Task Checklist

## Database
- [ ] Create PostgreSQL database
- [ ] Create migrations
- [ ] Create seed data
- [ ] Add indexes
- [ ] Add foreign keys
- [ ] Add unique constraints
- [ ] Test booking transaction

## Backend
- [ ] Express setup
- [ ] Environment configuration
- [ ] Authentication
- [ ] RBAC
- [ ] Center APIs
- [ ] Schedule APIs
- [ ] Booking API
- [ ] Token API
- [ ] Queue service
- [ ] Procurement service
- [ ] Notification service
- [ ] Admin APIs
- [ ] WebSocket layer
- [ ] Error handling
- [ ] Logging
- [ ] API tests

## React Native
- [ ] React Native + TypeScript project setup
- [ ] Navigation
- [ ] App providers and state/query setup
- [ ] Theme/design system
- [ ] Secure local storage
- [ ] Central API client
- [ ] Authentication
- [ ] Profile
- [ ] Center list
- [ ] Center details
- [ ] Schedule
- [ ] Booking
- [ ] Token
- [ ] Queue
- [ ] Real-time Socket.IO connection
- [ ] Procurement status
- [ ] Firebase Cloud Messaging
- [ ] History
- [ ] Error/offline/reconnection states
- [ ] React Native component tests
- [ ] Detox end-to-end tests

## React Admin
- [ ] Authentication
- [ ] Dashboard
- [ ] Center management
- [ ] Schedule management
- [ ] Farmer list
- [ ] Procurement monitoring
- [ ] Statistics
- [ ] Role restrictions

## ML
- [ ] Collect historical queue data
- [ ] Define prediction target
- [ ] Create baseline wait-time formula
- [ ] Create training dataset
- [ ] Train first model
- [ ] Evaluate against baseline
- [ ] Deploy prediction API only if useful
- [ ] Add center recommendation
- [ ] Track prediction accuracy

## DevOps
- [ ] Docker/local environment
- [ ] Staging environment
- [ ] Production environment
- [ ] CI/CD
- [ ] Database backup strategy
- [ ] Monitoring
- [ ] Error tracking
- [ ] Secret management

## QA
- [ ] Unit tests
- [ ] Integration tests
- [ ] End-to-end booking test
- [ ] Queue concurrency test
- [ ] Notification test
- [ ] Security test
- [ ] Mobile usability test
- [ ] SIH demo rehearsal

---

# 30. Revised Frontend Decision

The mobile frontend is now standardized on **React Native + TypeScript** instead of Flutter.

The final frontend split is:

```text
Farmer Mobile App → React Native + TypeScript
Admin Web Dashboard → React.js + TypeScript
Backend API → Node.js + Express
Database → PostgreSQL
Real-Time → WebSocket / Socket.IO
Push Notifications → Firebase Cloud Messaging
ML Extension → Python + FastAPI only when justified by data/performance needs
```

This change does not alter the core product workflow, backend API contract, database model, queue rules, procurement state machine, or ML scope. It changes the mobile implementation stack and replaces the Flutter-specific project structure and testing terminology with React Native equivalents.

## 30.1 Revised Development Order

Use this exact implementation sequence:

```text
1. Repository/monorepo setup + React Native TypeScript project
        ↓
2. PostgreSQL schema + migrations + seed data
        ↓
3. Backend project + environment configuration
        ↓
4. Authentication API + OTP/JWT + RBAC
        ↓
5. React Native navigation + app providers + API client
        ↓
6. Farmer authentication/login/profile
        ↓
7. Center + schedule APIs
        ↓
8. Farmer center list/details + schedules
        ↓
9. Slot booking transaction
        ↓
10. Booking UI + validation + confirmation
        ↓
11. Token generation + token screen
        ↓
12. Queue service + queue APIs
        ↓
13. React Native live queue screen
        ↓
14. Socket.IO real-time queue/status updates
        ↓
15. Procurement status workflow
        ↓
16. Center dashboard
        ↓
17. Admin dashboard
        ↓
18. Firebase Cloud Messaging + notification flows
        ↓
19. Baseline waiting-time calculation
        ↓
20. Center recommendation
        ↓
21. Offline/reconnection handling
        ↓
22. Backend + mobile + admin testing
        ↓
23. Security/concurrency testing
        ↓
24. Staging deployment
        ↓
25. SIH demo preparation and rehearsal
        ↓
26. ML improvements only after sufficient operational data
```

## 30.2 React Native Package Baseline

The mobile project should use the following library categories:

```text
react
react-native
typescript

@react-navigation/native
@react-navigation/native-stack

@tanstack/react-query
zustand

axios
zod
react-hook-form

@react-native-async-storage/async-storage
react-native-keychain

socket.io-client

@react-native-firebase/app
@react-native-firebase/messaging

jest
@testing-library/react-native
detox
```

Choose compatible current versions during project initialization rather than hard-coding versions in this master specification. Native dependencies must be checked against the React Native version selected for the project.

## 30.3 Frontend Responsibility Boundary

```text
React Native
    │
    ├── UI/screens
    ├── navigation
    ├── local/client state
    ├── API consumption
    ├── local caching
    ├── Socket.IO connection
    └── push notification handling
             │
             ↓
       Node.js + Express
             │
    ├── authentication
    ├── authorization
    ├── booking rules
    ├── token generation
    ├── queue calculations
    ├── procurement workflow
    ├── notifications
    └── real-time event publishing
             │
             ↓
         PostgreSQL
```

The server remains the source of truth for booking availability, token state, queue position, estimated waiting time, and procurement status.

---

# 31. Final Product Principle

> **Do not build only a booking app. Build a queue-management system that uses booking, real-time status, waiting-time estimation, notifications, and operational dashboards to reduce unnecessary farmer waiting and uncertainty.**

This document should be treated as the master development specification. Any future feature should be mapped to one of the product areas above and should not break the core booking → token → queue → verification → inspection → procurement → completion workflow.
