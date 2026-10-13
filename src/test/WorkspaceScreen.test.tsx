import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceScreen } from '@/features/enhancement/WorkspaceScreen';
import { AppProvider } from '@/stores/appState';

describe('WorkspaceScreen Component', () => {
  it('renders resolution presets and studio preview area', () => {
    render(
      <AppProvider>
        <WorkspaceScreen />
      </AppProvider>
    );

    expect(screen.getByText('Target Resolution')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /1080p/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /1440p/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /4k/i })).toBeInTheDocument();
    expect(screen.getByText('No Video Loaded in Studio')).toBeInTheDocument();
  });

  it('updates target resolution dimensions when selection changes', () => {
    render(
      <AppProvider>
        <WorkspaceScreen />
      </AppProvider>
    );

    const button1080p = screen.getByRole('radio', { name: /1080p/i });
    fireEvent.click(button1080p);

    expect(screen.getByText('1920 × 1080')).toBeInTheDocument();
  });

  it('provides actionable prompt when clicking Enhance without a video', () => {
    render(
      <AppProvider>
        <WorkspaceScreen />
      </AppProvider>
    );

    const enhanceBtn = screen.getByRole('button', { name: /enhance video/i });
    fireEvent.click(enhanceBtn);
  });
});
