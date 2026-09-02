# 🌾 Smart Farmer Procurement Management System

## 1. Problem

Farmers face several problems during agricultural procurement:

- Long waiting times at procurement centers.
- No clear information about procurement schedules.
- No way to know their position in the queue.
- Uncertainty about procurement status.
- Unnecessary travel and overcrowding at centers.

## 2. Solution

A digital platform that allows farmers to **book procurement slots, receive digital tokens, track their queue, and know their procurement status in real time**.

Procurement-center staff can manage the queue and update procurement status through a dashboard.

---

## 3. Main Users

### 👨‍🌾 Farmer

- Register/Login
- View nearby procurement centers
- View available schedules
- Book a slot
- Get digital token
- Track queue position
- Track procurement status
- Receive notifications

### 🏢 Procurement Center

- View today's farmers
- Manage tokens/queue
- Verify farmer
- Record procurement
- Update status

### 👨‍💼 Admin

- Manage procurement centers
- Manage schedules
- Monitor procurement
- View basic statistics

---

## 4. Core Workflow

```text
Farmer Login
     ↓
Select Procurement Center
     ↓
Select Date & Time Slot
     ↓
Get Digital Token
     ↓
Track Queue
     ↓
Visit Center When Turn Approaches
     ↓
Verification & Produce Inspection
     ↓
Procurement
     ↓
Status Updated
     ↓
Procurement Completed
```

---

## 5. MVP Features

### Farmer App

- [ ] Login/Register
- [ ] Farmer Profile
- [ ] Procurement Center List
- [ ] Schedule/Slot Selection
- [ ] Digital Token
- [ ] Live Queue Position
- [ ] Estimated Waiting Time
- [ ] Procurement Status
- [ ] Notifications

### Center Dashboard

- [ ] Staff Login
- [ ] Today's Queue
- [ ] Farmer Verification
- [ ] Call Next Farmer
- [ ] Update Procurement Status
- [ ] Record Quantity
- [ ] Complete Procurement

### Admin Dashboard

- [ ] Manage Centers
- [ ] Manage Schedules
- [ ] View Farmers
- [ ] View Procurement Statistics

---

## 6. Procurement Status

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

Other statuses:

```text
CANCELLED
RESCHEDULED
REJECTED
```

---

## 7. Technology Stack

### Mobile
Flutter

### Backend
Node.js + Express

### Database
PostgreSQL

### Authentication
OTP + JWT

### Notifications
Firebase Cloud Messaging

### Admin Dashboard
React.js

---

## 8. Basic Database

### Users

```text
id
name
mobile
role
address
district
village
```

### Procurement Centers

```text
id
name
location
district
latitude
longitude
daily_capacity
status
```

### Slots

```text
id
center_id
date
start_time
end_time
capacity
available_slots
```

### Tokens

```text
id
token_number
farmer_id
center_id
slot_id
status
queue_position
estimated_wait_time
```

### Procurement

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
```

---

## 9. Important APIs

```text
POST /auth/send-otp
POST /auth/verify-otp

GET  /centers
GET  /centers/:id/schedule

POST /slots/book

POST /tokens
GET  /tokens/:id
GET  /tokens/:id/status

POST /procurement
PUT  /procurement/:id/status
```

---

## 10. Project Architecture

```text
        Farmer App
            │
            ▼
       Backend API
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
   Auth   Queue  Procurement
     │      │      │
     └──────┼──────┘
            ▼
        PostgreSQL
            ▲
            │
    ┌───────┴───────┐
    │               │
Center Dashboard  Admin Dashboard
```

---

## 11. Key Innovation

The project should focus on **reducing waiting time and uncertainty**, not just booking.

### Smart Queue

```text
Your Token: A-125
Current Token: A-118
Position: 7
Estimated Wait: 35 minutes
```

### Smart Center Recommendation

```text
Center A → 45 farmers → 2 hrs wait
Center B → 12 farmers → 30 min wait

Recommended: Center B
```

### Real-Time Status

```text
✓ Token Generated
✓ Verification
✓ Inspection
→ Procurement
○ Completed
```

---

## 12. SIH Demo

For the final demonstration, show one complete scenario:

```text
Farmer
  ↓
Login
  ↓
Select Center
  ↓
Book Slot
  ↓
Get Token
  ↓
Track Queue
  ↓
Center Operator Processes Farmer
  ↓
Status Changes
  ↓
Procurement Completed
```

---

## 13. Development Priority

```text
1. Database
      ↓
2. Backend APIs
      ↓
3. Farmer Login
      ↓
4. Center & Schedule
      ↓
5. Token System
      ↓
6. Queue Management
      ↓
7. Procurement Status
      ↓
8. Center Dashboard
      ↓
9. Admin Dashboard
      ↓
10. Notifications
```

## 🎯 MVP Goal

> **A farmer should be able to book a procurement slot, receive a token, see their queue position and estimated waiting time, and receive the final procurement status without having to wait unnecessarily at the center.**
