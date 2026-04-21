'use client';
import { Component, ReactNode } from 'react';

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.error('[aligned] client error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', color: 'white', fontFamily: 'system-ui, sans-serif', gap: 16 }}>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)' }}>Something went wrong.</p>
          <a href="/" style={{ fontSize: 14, color: '#c8f97a', textDecoration: 'none' }}>Go home →</a>
        </div>
      );
    }
    return this.props.children;
  }
}
