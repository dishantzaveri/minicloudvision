import { render, screen } from '@testing-library/react';
import StatCards from './StatCards';

describe('StatCards', () => {
  test('renders summary values correctly', () => {
    render(
      <StatCards
        summary={{
          total_devices: 8,
          online: 6,
          offline: 1,
          degraded: 1,
          alerts: 2,
        }}
        deviceCount={8}
        linkCount={12}
        onlinePct={75}
      />
    );

    expect(screen.getByText(/devices monitored/i)).toBeInTheDocument();
    expect(screen.getByText(/online coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/needs attention/i)).toBeInTheDocument();
    expect(screen.getByText(/open alerts/i)).toBeInTheDocument();

    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('12 topology links discovered')).toBeInTheDocument();
    expect(screen.getByText('6 healthy devices')).toBeInTheDocument();
    expect(screen.getByText('1 degraded · 1 offline')).toBeInTheDocument();
    expect(screen.getByText('Investigate highlighted nodes')).toBeInTheDocument();
  });
});
