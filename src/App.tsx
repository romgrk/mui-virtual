import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#262626',
    }
  },
});



// import Component from './demo-date-pickers'
// import Component from './demo-employees'
// import Component from './demo-virtualization'
// import Component from './debug'
import Component from './demo-base-ui/select'
// import Component from './material-ui'




export default function App() {
  return (
    <ThemeProvider theme={darkTheme}>
      <div style={{ colorScheme: 'dark', padding: '2em' }}>
        <CssBaseline />
        <Component />
      </div>
    </ThemeProvider>
  );
}
