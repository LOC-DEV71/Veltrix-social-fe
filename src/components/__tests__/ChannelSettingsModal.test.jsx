import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChannelSettingsModal from '../ChannelSettingsModal';

// Mock the axios client
vi.mock('../../services/axiosClient', () => ({
  default: {
    put: vi.fn().mockResolvedValue({ data: { success: true, data: { name: 'updated-name' } } }),
    delete: vi.fn().mockResolvedValue({ data: { success: true } })
  }
}));

const mockChannel = {
  _id: 'chan1',
  name: 'general',
  topic: 'General chat',
  slowMode: 0,
  nsfw: false,
  permissionOverwrites: []
};

describe('ChannelSettingsModal', () => {
  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when not open', () => {
    const { container } = render(
      <ChannelSettingsModal 
        isOpen={false} 
        channel={mockChannel} 
        communityId="comm1" 
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders channel settings when open', () => {
    render(
      <ChannelSettingsModal 
        isOpen={true} 
        channel={mockChannel} 
        communityId="comm1" 
      />
    );
    // Should display channel name in uppercase in sidebar
    expect(screen.getByText('GENERAL')).toBeInTheDocument();
    
    // Check if input fields are populated
    const nameInput = screen.getByPlaceholderText('nhập-tên-kênh');
    expect(nameInput).toHaveValue('general');
  });

  it('updates channel name state on input', () => {
    render(
      <ChannelSettingsModal 
        isOpen={true} 
        channel={mockChannel} 
        communityId="comm1" 
      />
    );
    const nameInput = screen.getByPlaceholderText('nhập-tên-kênh');
    
    // Type new name
    fireEvent.change(nameInput, { target: { value: 'New Name' } });
    
    // Should auto format with hyphens and lowercase
    expect(nameInput).toHaveValue('new-name');
    
    // Should show "Bạn có thay đổi chưa lưu!"
    expect(screen.getByText('Bạn có thay đổi chưa lưu!')).toBeInTheDocument();
  });
});
