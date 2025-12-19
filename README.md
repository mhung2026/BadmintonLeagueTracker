# 🏸 Badminton League Tracker – Legend Alliance

A simple, mobile-first **badminton league management web app** that allows multiple users to **view and update shared data in real time** using **Google Sheets** as a lightweight backend.

Perfect for:
- Office badminton groups
- Badminton clubs
- Small internal tournaments

---

## ✨ Features

### 👥 Player Management
- Add / remove players
- Shared player list for all users

### 🏸 Match Creation
- Supports:
  - **Singles (1 vs 1)**
  - **Doubles (2 vs 2)**
- Select winning team
- Match history is saved automatically

### 🏆 Leaderboard
- Automatic scoring:
  - **Singles**: win +3, lose +1
  - **Doubles**: win +2 per player, lose +1
- Sorted by total points
- Displays:
  - Total matches
  - Wins

### 📜 Match History
- Stores:
  - Match type
  - Players
  - Winner
  - Match time
- Time is stored in **UTC** and displayed in the **user’s local timezone**

---

## 🌍 Data Storage & Sharing

- ❌ No `localStorage`
- ✅ Data stored in **Google Sheets**
- ✅ All users see the **same shared data**
- ✅ No traditional backend server required

---

## 🛠 Tech Stack

- **React + Vite**
- **Google Apps Script** (serverless backend)
- **Google Sheets** (database)
- **Vercel** (deployment)

---

## 🚀 Demo

Live demo (Vercel): [Link](https://badminton-league-tracker.vercel.app/)
---

## ⚙️ Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/mhung2026/BadmintonLeagueTracker.git
cd BadmintonLeagueTracker
```
### 2. Install dependencies
```bash
npm install
```
### 3. Run locally
```bash
npm run dev
```
Open in browser: http://localhost:5173
## 🔌 Google Sheets Integration
### 1. Create Google Apps Script
 - Create a new Google Apps Script project
 - Deploy as Web App
 - Access level: Anyone
 - Example code: [Link](https://github.com/mhung2026/BadmintonLeagueTracker/blob/main/AppscriptCode.gs)
### 2. Configure API URL
In src/App.jsx: 
```bash
const API_URL = "https://script.google.com/macros/s/XXXX/exec";
```
## 📄 Data Structure
**Player**
```bash
{
  "id": 1766107958513,
  "name": "Hung"
}
```
**Match**
```bash
{
  "id": 1766107958513,
  "name": "Hung"
}
```
## 🕒 Timezone Handling
 - Stored in Google Sheets: ISO 8601 (UTC)
 - Displayed in UI: Converted to user’s local timezone using:
```bash
new Date(createdAt).toLocaleString()
```
## 👤 Author: **mhung2026**
