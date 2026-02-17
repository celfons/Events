/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Footer from '../components/Footer';

describe('Footer Component', () => {
  it('renders footer with copyright text', () => {
    render(<Footer />);
    
    const footer = screen.getByRole('contentinfo');
    const copyright = screen.getByText(/2024 Plataforma de Eventos/i);
    expect(footer).toBeInTheDocument();
    expect(copyright).toBeInTheDocument();
  });
});
