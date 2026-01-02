import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock Socket.io for testing
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn()
  }))
}));

// Mock environment variables
Object.assign(process.env, { NODE_ENV: 'test' });