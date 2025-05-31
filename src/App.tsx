import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#262626',
    },
  },
});

import Component from './Demo';

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
