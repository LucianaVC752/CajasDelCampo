import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from '../../components/Auth/AdminRoute';
import { AuthContext } from '../../contexts/AuthContext';

function renderWithAuth(routeElement, authValue, initialPath = '/admin') {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/admin" element={routeElement} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

test('muestra spinner cuando loading=true', () => {
  renderWithAuth(
    <AdminRoute><div>Sección admin</div></AdminRoute>,
    { user: { id: 1, role: 'admin' }, isAdmin: true, loading: true }
  );
  expect(screen.getByText(/Verificando permisos/i)).toBeInTheDocument();
});

test('redirecciona a /login cuando no hay user', () => {
  renderWithAuth(
    <AdminRoute><div>Sección admin</div></AdminRoute>,
    { user: null, isAdmin: false, loading: false }
  );
  expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
});

test('redirecciona a /dashboard cuando user no es admin', () => {
  renderWithAuth(
    <AdminRoute><div>Sección admin</div></AdminRoute>,
    { user: { id: 2, role: 'user' }, isAdmin: false, loading: false }
  );
  expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
});

test('renderiza children cuando user es admin', () => {
  renderWithAuth(
    <AdminRoute><div>Sección admin</div></AdminRoute>,
    { user: { id: 1, role: 'admin' }, isAdmin: true, loading: false }
  );
  expect(screen.getByText(/Sección admin/i)).toBeInTheDocument();
});