import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it('renders with default variant', () => {
    render(<Button>Test Button</Button>)
    const button = screen.getByRole('button', { name: 'Test Button' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-gradient-primary')
  })

  it('renders with outline variant', () => {
    render(<Button variant="outline">Outline Button</Button>)
    const button = screen.getByRole('button', { name: 'Outline Button' })
    expect(button).toHaveClass('border')
    expect(button).toHaveClass('bg-background')
  })

  it('renders with different sizes', () => {
    render(<Button size="sm">Small Button</Button>)
    const button = screen.getByRole('button', { name: 'Small Button' })
    expect(button).toHaveClass('h-9')
  })

  it('handles click events', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Clickable Button</Button>)
    const button = screen.getByRole('button', { name: 'Clickable Button' })
    
    fireEvent.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>)
    const button = screen.getByRole('button', { name: 'Disabled Button' })
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>)
    const button = screen.getByRole('button', { name: 'Custom Button' })
    expect(button).toHaveClass('custom-class')
  })

  it('supports gradient styling', () => {
    render(<Button>Gradient Button</Button>)
    const button = screen.getByRole('button', { name: 'Gradient Button' })
    expect(button).toHaveClass('bg-gradient-primary')
    expect(button).toHaveClass('hover:shadow-glow')
    expect(button).toHaveClass('transition-smooth')
  })
})