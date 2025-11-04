import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/Auth/ProtectedRoute';
import { AuthContext } from '../../contexts/AuthContext';

function renderWithAuth(routeElement, authValue, initialPath = '/protected') {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={routeElement} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

test('muestra spinner cuando loading=true', () => {
  renderWithAuth(
    <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute>,
    { user: null, loading: true }
  );

  expect(screen.getByText(/Verificando autenticación/i)).toBeInTheDocument();
});

test('redirecciona a /login cuando user=null', () => {
  renderWithAuth(
    <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute>,
    { user: null, loading: false }
  );

  expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
});

test('renderiza children cuando user existe', () => {
  renderWithAuth(
    <ProtectedRoute><div>Contenido protegido</div></ProtectedRoute>,
    { user: { id: 1, role: 'user' }, loading: false }
  );

  expect(screen.getByText(/Contenido protegido/i)).toBeInTheDocument();
});