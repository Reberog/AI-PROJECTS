import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Portfolio from './App.tsx'
import './styles.css'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Add error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

console.log('App starting...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  console.log('Root element found, rendering app...');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <Portfolio />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log('App rendered successfully');
}
