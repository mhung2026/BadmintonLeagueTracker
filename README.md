# 🏸 Badminton League Tracker – Legend Alliance

A mobile-first badminton league management web app that allows multiple users to create matches, track rankings, and share data in real time using Google Sheets as a serverless backend.

Designed with real tournament logic in mind: once a match is recorded, its score is locked and never recalculated, even if scoring rules change later.

## 🎯 Use Cases##

 - Office badminton groups
 - Badminton clubs
 - Small internal tournaments
## 💡 Why This Project?

This project was built to explore:
- Tournament-grade scoring logic
- Immutable match history design
- Serverless architectures using Google Apps Script
- Real-time shared state without a traditional backend

## ✨ Key Features
### 👥 Player Management
 - Add new players
 - ❌ Players with match history cannot be deleted
 - Shared player list across all users
### 🏸 Match Creation
- Supports:
   - Singles (1 vs 1)
   - Doubles (2 vs 2)
- Enter actual match scores
- Winner is calculated automatically
- Each match locks its scoring snapshot at creation time
### 🏆 Leaderboard (Tournament-Grade Logic)
 - Rankings are calculated from match history
 - Each match stores a scoring snapshot, including:
   - Team points before the match
   - Rating difference
   - Divisor used
   - Final point delta
- Changing scoring rules does NOT affect past matches
- Displays:
  - Total points
  - Total matches
  - Wins
### 📜 Match History
- Stores:
  - Match type (Singles / Doubles)
  - Players in each team
  - Final score
  - Winner
  - Match time
- Match time is stored in UTC and displayed in the user’s local timezone
### ⚙️ Scoring Configuration
- Configure point calculation rules using:
  - Maximum rating difference
  - Divisor
- Rules apply only to new matches
- Old matches remain unchanged
## 🌍 Data Storage & Sharing
- ❌ No localStorage
- ✅ Data stored in Google Sheets
- ✅ All users see the same shared data
- ✅ No traditional backend server required
## 🛠 Tech Stack
- React + Vite
- Google Apps Script (serverless backend)
- Google Sheets (database)
- Vercel (deployment)
## 🚀 Live Demo
```base
https://badminton-league-tracker.vercel.app/
```
## ⚙️ Local Development Setup
#### 1. Clone the repository
```base
git clone https://github.com/mhung2026/BadmintonLeagueTracker.git

cd BadmintonLeagueTracker
```
#### 2. Install dependencies
```base
npm install
```
#### 3. Run locally
```base
npm run dev
```
Open in browser:
http://localhost:5173

## 🔌 Google Sheets Integration
#### 1. Create Google Apps Script
   - Create a new Google Apps Script project
   - Paste the backend code
   - Deploy as Web App
   - Set access:
   - Who has access: Anyone
   - Execute as: Me
   - Backend example: [Link](https://github.com/mhung2026/BadmintonLeagueTracker/blob/main/AppscriptCode.gs)

#### 2. Configure API URL

- In src/App.jsx:
```js
const API_URL = "https://script.google.com/macros/s/XXXX/exec";
```
## 📄 Data Structure
**Player**
```json
{
  "id": "uuid-string",
  "name": "Hung"
}
```
**Match**
```json
{
  "id": "uuid-string",
  "type": "singles | doubles",
  "team1": ["playerId1"],
  "team2": ["playerId2"],
  "score1": 21,
  "score2": 15,
  "winner": 1,
  "date": "2025-01-01T10:30:00.000Z",
  "meta": {
    "team1PtsBefore": 12,
    "team2PtsBefore": 8,
    "ratingDiff": 4,
    "divisorUsed": 2,
    "scoreDiff": 6,
    "pointDelta": 3
  }
}
```
## 🕒 Timezone Handling
- Stored in Google Sheets: ISO 8601 (UTC)
- Displayed in UI using:
```js
new Date(date).toLocaleString()
```
## ⚠️ Limitations
- No authentication (anyone can modify data)
- Google Sheets is not optimized for high concurrency
- Not suitable for large-scale tournaments

## 👤 Author
**mhung2026**  
GitHub: https://github.com/mhung2026

