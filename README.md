# Chatly — Random Text Chat

A Joingy-style random **text** chat app (no video): strangers are paired instantly,
can match on shared interests, see typing indicators, and hop to the next stranger
with one click or the Esc key. Original branding and copy; built on the StrangerChat
matching engine (Node + Socket.IO + React).

## Features
- One-click random pairing with a live online counter
- Interest-based matching (comma-separated topics) with anyone-fallback
- Typing indicators, chat timer, New (Esc) / Stop controls
- 18+ confirmation gate, fully anonymous — no accounts, nothing stored

## Run locally
```bash
# server
cd server && npm install && npm start        # :3001
# client (new terminal)
cd client && npm install && npm run dev      # :5173
```
Client reads the server URL from `VITE_API_URL` (defaults to http://localhost:3001).

## Deploy
- **Server:** Render web service, root `server`, start `npm start`.
- **Client:** any static host (Vercel/Render static), root `client`, build `npm run build`,
  env `VITE_API_URL=https://<your-server>.onrender.com`.
