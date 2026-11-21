# AssetFlow — IT Asset Lifecycle and Maintenance Management System

## Backend-enabled version

The frontend fallback is compatible with both Express 4 and Express 5; it avoids the deprecated/invalid `app.get('*')` wildcard pattern.
This project now includes a Node.js + Express backend. Asset records are stored in `data/assets.json` on the server instead of only in the browser. The existing dashboard, inventory, maintenance, and reports use the backend API.

## Requirements
- Node.js 18 or later
- npm

## Run in VS Code
1. Extract the ZIP and open the `IT_Asset_Lifecycle_Maintenance_System` folder in VS Code.
2. Open the terminal in that folder.
3. Run `npm install` (first run only).
4. Run `npm start`.
5. Open `http://localhost:5000` in your browser.

Do not open `index.html` directly or use Live Server for this version. The Express server serves the frontend and API together.

## Backend API
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check backend status |
| GET | `/api/assets` | Get all assets |
| PUT | `/api/assets` | Validate and save the asset collection |

The API validates required fields and prevents duplicate asset IDs. Data is written to `data/assets.json` and remains available after restarting the server.

## Features
- Dashboard with total, assigned, available and attention-needed counts
- Add/edit assets with unique asset IDs
- Search and filter inventory
- Maintenance schedule and warranty/overdue reminders
- Inventory/category reports and CSV export
- Express REST API and persistent server-side JSON storage

## Reset demo data
Stop the server, delete `data/assets.json`, then restart the app. The sample assets will be created again on first load.

## Academic project note
This is a local academic prototype. It includes a working backend and persistent JSON storage, but does not include user authentication, role-based access control, or a connection to a live ServiceNow instance.
