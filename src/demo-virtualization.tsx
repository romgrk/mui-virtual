import * as React from 'react';
import { DataGridPremium as DataGrid } from '@mui/x-data-grid-premium';

function useData(rowLength: number, columnLength: number) {
  const [data, setData] = React.useState({
    columns: [] as any[],
    rows: [] as any[]
  });

  React.useEffect(() => {
    const rows = [] as any[];

    for (let i = 0; i < rowLength; i += 1) {
      const row = {
        id: i,
      } as any;

      for (let j = 1; j <= columnLength; j += 1) {
        row[`price${j}M`] = `${i.toString()}, ${j} `;
      }

      rows.push(row);
    }

    const columns = [];

    for (let j = 1; j <= columnLength; j += 1) {
      columns.push({ field: `price${j}M`, headerName: `${j}M` });
    }

    setData({
      rows,
      columns,
    });
  }, [rowLength, columnLength]);

  return data;
}

export default function ColumnVirtualizationGrid() {
  const data = useData(1000, 1000);
  const [show, setShow] = React.useState(false)

  return (
    <div>
      <button onClick={() => setShow(!show)}>toggle</button>
      {show &&
        <div style={{ height: 400, width: '100%' }}>
          <DataGrid {...data} />
        </div>
      }
    </div>
  );
}
