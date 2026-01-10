/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navbar from '../components/Navbar';

describe('Navbar Component', () => {
  it('renders navbar with brand', () => {
    render(<Navbar user={null} onLogout={() => {}} showLogin={() => {}} currentPage="events" />);
    
    const brand = screen.getByText(/Plataforma de Eventos/i);
    expect(brand).toBeInTheDocument();
  });

  it('shows login button when user is not authenticated', () => {
    render(<Navbar user={null} onLogout={() => {}} showLogin={() => {}} currentPage="events" />);
    
    const loginButton = screen.getByText(/Login/i);
    expect(loginButton).toBeInTheDocument();
  });

  it('shows user info and logout button when user is authenticated', () => {
    const user = { username: 'testuser', role: 'user' };
    render(<Navbar user={user} onLogout={() => {}} showLogin={() => {}} currentPage="events" />);
    
    const greeting = screen.getByText(/Olá, testuser/i);
    expect(greeting).toBeInTheDocument();
    
    const logoutButton = screen.getByText(/Sair/i);
    expect(logoutButton).toBeInTheDocument();
  });

  it('shows Users link for superusers', () => {
    const user = { username: 'admin', role: 'superuser' };
    render(<Navbar user={user} onLogout={() => {}} showLogin={() => {}} currentPage="events" />);
    
    const usersLink = screen.getByText(/Usuários/i);
    expect(usersLink).toBeInTheDocument();
  });

  it('does not show Users link for regular users', () => {
    const user = { username: 'testuser', role: 'user' };
    render(<Navbar user={user} onLogout={() => {}} showLogin={() => {}} currentPage="events" />);
    
    const usersLink = screen.queryByText(/Usuários/i);
    expect(usersLink).not.toBeInTheDocument();
  });
});
