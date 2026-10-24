import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { describe, expect, it } from 'vitest';

describe('CryptoInvest admin shell', () => {
  it('renders the login page by default when the route is /login', () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/CryptoInvest/i)).toBeInTheDocument();
  });

  it('renders the dashboard heading when visiting the home route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/CEO dashboard/i)).toBeInTheDocument();
  });
});
