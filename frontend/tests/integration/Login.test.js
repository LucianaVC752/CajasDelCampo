import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Login from '../../src/pages/Login';
import { AuthContext } from '../../src/contexts/AuthContext';

function renderWithAuthAndRouter(ui, { loginImpl, initialEntries = ['/login'] } = {}) {
  const authValue = {
    user: null,
    loading: false,
    login: loginImpl || (async () => ({ success: true }))
  };

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={
          <AuthContext.Provider value={authValue}>
            {ui}
          </AuthContext.Provider>
        } />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('Login page integration', () => {
  test('typing email and password and successful submit navigates to dashboard', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn(async () => ({ success: true }));

    renderWithAuthAndRouter(<Login />, { loginImpl: mockLogin });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    // Should navigate to dashboard on success
    const dashboard = await screen.findByTestId('dashboard');
    expect(dashboard).toBeInTheDocument();
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'Password123!');
  });

  test('shows error feedback on invalid credentials', async () => {
    const user = userEvent.setup();
    const mockLogin = jest.fn(async () => ({ success: false, error: 'Credenciales inválidas' }));

    renderWithAuthAndRouter(<Login />, { loginImpl: mockLogin });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Contraseña');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    await user.type(emailInput, 'wrong@example.com');
    await user.type(passwordInput, 'WrongPass!');
    await user.click(submitButton);

    // Error alert should appear with message
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/credenciales inválidas/i);
    // Should not navigate
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  test('shows validation messages with invalid inputs', async () => {
    const user = userEvent.setup();
    // login is not called because form validation fails
    const mockLogin = jest.fn();

    renderWithAuthAndRouter(<Login />, { loginImpl: mockLogin });

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i });

    // Type an invalid email and leave password empty
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    // Feedback banner
    const banner = await screen.findByText(/por favor corrige los errores en el formulario/i);
    expect(banner).toBeInTheDocument();

    // Field-specific helper texts
    const emailError = await screen.findByText(/formato de email inválido/i);
    const passwordError = await screen.findByText(/la contraseña es requerida/i);
    expect(emailError).toBeInTheDocument();
    expect(passwordError).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });
});