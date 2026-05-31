import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommunitySettingsModal from '../CommunitySettingsModal';

// Mock dependencies
vi.mock('../../services/axiosClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { success: true, data: { _id: 'comm1', name: 'Test Server', members: [] } } }),
    put: vi.fn(),
    post: vi.fn()
  }
}));

// Mock react-redux
vi.mock('react-redux', () => ({
  useSelector: vi.fn().mockReturnValue({ _id: 'user1', username: 'tester' })
}));

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn().mockReturnValue({
    on: vi.fn((event, cb) => {
      if (event === 'connect') cb();
    }),
    emit: vi.fn((event, cb) => {
      if (event === 'get_online_users') cb(['user1']);
    }),
    disconnect: vi.fn()
  })
}));

const mockCommunity = {
  _id: 'comm1',
  name: 'Test Server',
  icon: '',
  owner: 'user1',
  members: [{ user: 'user1', role: 'owner' }]
};

describe('CommunitySettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <CommunitySettingsModal isOpen={false} community={mockCommunity} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders community profile by default', async () => {
    render(
      <CommunitySettingsModal isOpen={true} community={mockCommunity} />
    );
    
    // Check main heading
    expect(screen.getByText('Hồ Sơ Máy Chủ')).toBeInTheDocument();
    
    // Check input field populated
    const nameInputs = screen.getAllByDisplayValue('Test Server');
    expect(nameInputs.length).toBeGreaterThan(0);
  });
});
