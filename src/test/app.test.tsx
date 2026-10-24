import { render, screen } from '@testing-library/react';
import App from '../App';
import { describe, expect, it } from 'vitest';

describe('CryptoInvest admin shell', () => {
  it('renders the login page by default when the route is /login', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);
    expect(screen.getByText(/CryptoInvest/i)).toBeInTheDocument();
  });

  it('renders the dashboard heading when visiting the home route', () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(screen.getByText(/CEO dashboard/i)).toBeInTheDocument();
  });
});
