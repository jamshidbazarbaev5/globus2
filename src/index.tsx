import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
const queryClient = new QueryClient()
root.render(
  <QueryClientProvider client={queryClient}>
    <MantineProvider>
    <App />

    </MantineProvider>
  </QueryClientProvider>

);
