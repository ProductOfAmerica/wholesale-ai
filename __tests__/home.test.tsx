import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from '../app/page';

describe('HomePage', () => {
  it('should render the main heading', () => {
    render(<HomePage />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Wholesale AI - Negotiation Copilot');
  });

  it('should render the start call link', () => {
    render(<HomePage />);
    
    const link = screen.getByRole('link', { name: 'Start Call Interface' });
    expect(link).toHaveAttribute('href', '/call');
  });

  it('should display feature list', () => {
    render(<HomePage />);
    
    expect(screen.getByText('Real-time speech transcription')).toBeInTheDocument();
    expect(screen.getByText('AI-powered negotiation analysis')).toBeInTheDocument();
    expect(screen.getByText('Motivation scoring and objection detection')).toBeInTheDocument();
    expect(screen.getByText('Strategic response suggestions')).toBeInTheDocument();
  });
});