# 👁️ DRISHTI — Dynamic Roadway Intelligence System for Hazard Tracking & Intervention

Smart urban traffic management prototype for SIH 2026. Three interfaces, one unified backend, real-time data flow.

## ✨ Features

| Interface | Highlights |
|-----------|-----------|
| **Driver / Citizen Mobile App** | Live hazard map · in-app reporting with camera + GPS · voice alerts · trust score gamification |
| **Police Dashboard** | Live zone control · one-click report verification · adaptive signal override · ambulance mode · analytics |
| **Backend** | Express + Socket.io · JWT auth · adaptive signal algorithm · AI image pre-check · prediction engine |
| **Camera Simulator** | Simulates 6 intersections every 30s |

**Police Dashboard** → http://localhost:3000

**Backend API** → http://localhost:5000

**Mobile App** → Scan QR code from Expo

## 📱 Mobile on Physical Device

Edit mobile-app/src/api.js and replace localhost with your laptop's LAN IP

E.g.: *const HOST = 'http://192.168.1.42:5000';*

## 🚀 Quick Start (3 commands)

```bash
# 1. Install everything
npm run setup

# 2. Start backend + police dashboard + simulator
npm run dev

# 3. In a new terminal — start mobile app
npm run dev:mobile 

## Demo Credentials

Role	                     Email
Police Officer	           police@drishti.io
Second Officer	           police2@drishti.io
Admin	                     admin@drishti.io
Driver	                   driver@drishti.io
Citizen	                   citizen@drishti.io

pwd: password123
