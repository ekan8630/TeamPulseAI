
# TeamPulse AI

A unique smart task management platform built using:
- React + Vite
- Node.js + Express
- MongoDB

## Run Frontend

cd client
npm install
npm run dev

## Run Backend

cd server
npm install
npm run dev

## Environment Variables

Create .env inside server folder:

PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret

## Deploy On Railway (Full Project)

Deploy this as **2 Railway services** in the same project:
- Service 1: `server` (API)
- Service 2: `client` (frontend)

### 1) Backend service (`server`)

1. In Railway, create a new project from your GitHub repo.
2. Add a new service and set **Root Directory** to `server`.
3. Railway will use `server/railway.json` automatically.
4. Add backend environment variables:
   - `MONGO_URI=...`
   - `JWT_SECRET=...`
   - `CORS_ORIGIN=https://<your-frontend-domain>.up.railway.app`
5. Deploy and copy the backend public URL:
   - `https://<your-backend-domain>.up.railway.app`

### 2) Frontend service (`client`)

1. Add another service in the same Railway project.
2. Set **Root Directory** to `client`.
3. Railway will use `client/railway.json`.
4. Add frontend environment variable:
   - `VITE_API_URL=https://<your-backend-domain>.up.railway.app/api`
5. Deploy and copy the frontend URL:
   - `https://<your-frontend-domain>.up.railway.app`

### 3) Final CORS update

After frontend is live, go back to backend service variables and ensure:
- `CORS_ORIGIN=https://<your-frontend-domain>.up.railway.app`

Redeploy backend once more.

### 4) Verify

- Frontend loads on Railway URL
- Signup/Login works
- Team/project/task CRUD works
- Dashboard data loads

### Notes

- Backend health endpoint: `/api/health`
- Backend startup command: `npm run start`
- Frontend startup command: `npm run start`
