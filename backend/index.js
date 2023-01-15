const express = require('express');
const WebSocket = require('ws');
const { uniqueNamesGenerator, adjectives, colors, animals } = require('unique-names-generator');

// Rows to send on intialization
const MAX_ROWS = 1000;

const app = express()

const promiseWSSend = (ws, message) => new Promise((res, rej) => {
  ws.send(message, (err) => {
    if (err) {
      rej(err);
    } else {
      res();
    }
  })
})

app.use(
  express.static('../frontend/dist', {
    // Neccessary to use the Origin Private File System, prevents use of map tiles in most mapgl's
    setHeaders: function (res, path, stat) {
      res.set('Cross-Origin-Embedder-Policy', 'require-corp');
      res.set('Cross-Origin-Opener-Policy', 'same-origin');
    },
  })
);

const server = app.listen(8080, () => {
  console.log('LISTENING ON PORT 8080');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws) => {
  ws.on('message', async (msg) => {
    const message = msg.toString();
    if (message === 'INIT_TABLE') {
      // When a client wants to init the sqlite db, send them "all" the rows
      for (let i = 1; i <= MAX_ROWS; i++) {
        await promiseWSSend(ws, JSON.stringify({
          type: 'INIT_TABLE',
          payload: {
            id: i,
            name: uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }),
            latitude: (Math.random() * 180) - 90,
            longitude: (Math.random() * 360) - 180,
          },
        }));
      }
      await promiseWSSend(ws, JSON.stringify({
        // Best effort, no confirmation, no waiting for anything other than send complete
        type: 'INIT_TABLE_COMPLETE',
      }));
    }
  });

  // Occasionally update random rows with new data
  setInterval(() => {
    ws.send(JSON.stringify({
      type: 'TABLE_UPDATE',
      payload: {
        id: Math.floor((Math.random() * MAX_ROWS) + 1),
        name: uniqueNamesGenerator({ dictionaries: [adjectives, colors, animals] }),
        latitude: (Math.random() * 180) - 90,
        longitude: (Math.random() * 360) - 180,
      }
    }))
  }, 3000);
});