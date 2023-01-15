import React, { FC, useEffect, useMemo, useState } from 'react';
import { Map, Marker } from "pigeon-maps"
import { stamenToner } from 'pigeon-maps/providers'
import Table from 'rc-table';

const tableColumns = [
  {
    key: 'id',
    dataIndex: 'id',
    title: 'ID',
  }, {
    key: 'name',
    dataIndex: 'name',
    title: 'Name',
  },
  {
    key: 'latitude',
    dataIndex: 'latitude',
    title: 'Latitude',
  },
  {
    key: 'longitude',
    dataIndex: 'longitude',
    title: 'Longitude',
  },
];

const WorkerComponent: FC = () => {
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [tableState, setTableState] = useState('NULL');
  const [rowCount, setRowCount] = useState(0);
  const [tableData, setTableData] = useState<{
    id: number;
    name: string;
    latitude: string;
    longitude: string;
  }[]>([]);
  useEffect(() => {
    if (window.sqliteWorker) {
      const message = (message: MessageEvent<any>) => {
        if (message.data?.type === 'TABLE_UPDATE') {
          setRowCount(message.data.payload?.count);
          setTableState(message.data.payload?.state);
        } else if (message.data?.type === 'TABLE_DISPLAY') {
          setTableData(message.data.payload?.rows);
        } else if (message.data?.type === 'log') {
          if (['warning', 'error'].includes(message.data.payload?.logLevel)) {
            setError(message.data.payload?.args?.toString() || '');
          } else {
            setLog((prev) => [...prev, message.data.payload?.args?.toString()])
          }
        }
      };
      window.sqliteWorker.onmessage = message;
      return () => {
        window.sqliteWorker.removeEventListener('message', message);
      };
    }
  }, [window.sqliteWorker]);
  useEffect(() => {
  }, []);
  return (
    <div>
      {/* Maps do not work due to cross origin limitation required to use Origin Private File System */}
      {/* <Map height={300} defaultCenter={[50.879, 4.6997]} defaultZoom={11} provider={stamenToner}>
        <Marker width={50} anchor={[50.879, 4.6997]} />
      </Map> */}
      <div>
        Table state: {tableState}
      </div>
      <div>
        Rows in table: {rowCount}
      </div>
      <button onClick={() => window.sqliteWorker.postMessage('DISPLAY')}>Show database</button>
      <Table
        columns={tableColumns}
        data={tableData}
      />
      <div style={{ color: 'red' }}>
        {error}
      </div>
      <ul>
        {log.map((logItem) => <li>{logItem}</li>)}
      </ul>
    </div>
  )
};

export default WorkerComponent;