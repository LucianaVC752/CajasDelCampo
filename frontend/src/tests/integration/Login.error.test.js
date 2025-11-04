import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../../pages/Login';
import { AuthContext } from '../../contexts/AuthContext';

function renderLogin(authValue) {
  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={["/login"]}>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

test('muestra error cuando login falla', async () => {
  const user = userEvent.setup();
  const mockLogin = jest.fn(async () => ({ success: false, error: 'Credenciales inválidas' }));
  renderLogin({ login: mockLogin });

  await user.type(screen.getByLabelText(/Email/i), 'user@example.com');
  await user.type(screen.getByLabelText(/Contraseña/i), 'Password123!');
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

  expect(mockLogin).toHaveBeenCalledWith('user@example.com', 'Password123!');
  expect(await screen.findByText(/Credenciales inválidas/i)).toBeInTheDocument();
});

test('muestra errores de validación en el formulario', async () => {
  const user = userEvent.setup();
  const mockLogin = jest.fn(async () => ({ success: true }));
  renderLogin({ login: mockLogin });

  await user.type(screen.getByLabelText(/Email/i), 'bad-email');
  await user.type(screen.getByLabelText(/Contraseña/i), '123');
  await user.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

  expect(await screen.findByText(/Por favor corrige los errores/i)).toBeInTheDocument();
});