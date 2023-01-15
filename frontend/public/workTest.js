const logHtml = function (logLevel, ...args) {
  postMessage({
    type: 'log',
    payload: { logLevel, args },
  });
};

const log = (...args) => logHtml('', ...args);
const warn = (...args) => logHtml('warning', ...args);
const error = (...args) => logHtml('error', ...args);

let db;
let created = false;
let initialized = false;
const socket = new WebSocket('ws://localhost:8080');
const initialize = async () => {
  let sqlite3Js = 'sqlite3.js';
  const urlParams = new URL(self.location.href).searchParams;
  if (urlParams.has('sqlite3.dir')) {
    sqlite3Js = urlParams.get('sqlite3.dir') + '/' + sqlite3Js;
  }
  importScripts(sqlite3Js);
  self.sqlite3InitModule({
    print: log,
    printErr: error,
  }).then(function (sqlite3) {
    const oo = sqlite3.oo1; /*high-level OO API*/
    try {
      if (sqlite3.opfs) {
        db = new sqlite3.opfs.OpfsDb('/mydb.sqlite3');
        log('The OPFS is available.');
      } else {
        db = new oo.DB('/mydb.sqlite3', 'ct');
        log('The OPFS is not available.');
      }
      db.exec('DROP TABLE IF EXISTS locations');
      db.exec('CREATE TABLE IF NOT EXISTS locations(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, latitude TEXT, longitude TEXT)');
      created = true;
      socket.send('INIT_TABLE');
    } catch (e) {
      console.error('Exception:', e.message);
      error(e);
    } finally {
    }
  });
}


socket.addEventListener('open', (event) => {
  initialize();
});
socket.addEventListener('message', (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (err) {
  }
  try {
    if (created && data.type === 'INIT_TABLE') {
      db.exec({
        sql: 'insert into locations(id, name,latitude, longitude) values (?,?,?,?)',
        bind: [data.payload.id, data.payload.name, data.payload.latitude, data.payload.longitude],
      });
      db.exec({
        sql: 'SELECT COUNT(*) from locations',
        callback: (row) => {
          postMessage({
            type: 'TABLE_UPDATE',
            payload: { count: row[0], state: 'INITIALIZING' },
          });
        }
      });
    }
    if (created && data.type === 'INIT_TABLE_COMPLETE') {
      initialized = true;
      db.exec({
        sql: 'SELECT COUNT(*) from locations',
        callback: (row) => {
          postMessage({
            type: 'TABLE_UPDATE',
            payload: { count: row[0], state: 'INITIALIZED' },
          });
        }
      })
    }
    if (initialized && data.type === 'TABLE_UPDATE') {
      db.exec({
        sql: 'insert into locations(id, name,latitude, longitude) values (?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name, latitude=excluded.latitude, longitude=excluded.longitude',
        bind: [data.payload.id, data.payload.name, data.payload.latitude, data.payload.longitude],
      });
    }
  } catch (err) {
    error(err);
  }
});

self.onmessage = (e) => {
  if (e.data === 'DISPLAY' && created) {
    const values = [];
    db.exec({
      sql: 'select id, name, latitude, longitude from locations order by id',
      rowMode: 'array',
      callback: function (row) {
        values.push(row);
      },
    });
    postMessage({
      type: 'TABLE_DISPLAY',
      payload: {
        rows: values.map((rowArr) => ({
          id: rowArr[0],
          name: rowArr[1],
          latitude: rowArr[2],
          longitude: rowArr[3],
        }))
      },
    });
  }
}