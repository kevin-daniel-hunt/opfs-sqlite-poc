
# OPFS Sqlite POC

This small project will setup a frontend and backend environment for serving mock data through a websocket from an express server to a webworker on the frontend (React + Vite) which will store the data using sqlite.wasm and OPFS.

## Steps to run project

First clone this repo onto your machine.

then run the following commands

- `cd frontend`
- `npm install`
- `npx vite build`
- `cd ../backend`
- `npm install`
- `node index.js`


You should now be able to access the demo on `localhost:8080`