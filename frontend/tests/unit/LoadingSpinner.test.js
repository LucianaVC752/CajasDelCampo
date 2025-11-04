import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../src/components/UI/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renderiza con el mensaje por defecto', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
  });

  it('renderiza con un mensaje personalizado', () => {
    render(<LoadingSpinner message="Preparando datos" />);
    expect(screen.getByText('Preparando datos')).toBeInTheDocument();
  });
});