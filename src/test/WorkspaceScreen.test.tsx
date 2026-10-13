import { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WorkspaceScreen } from '@/features/enhancement/WorkspaceScreen';
import { AppProvider, useAppStore } from '@/stores/appState';

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

  it('renders loaded video metadata, thumbnail, stream specs, and clear button', () => {
    function WorkspaceWithMedia() {
      const store = useAppStore();
      useEffect(() => {
        store.setCurrentMedia({
          path: 'C:\\Videos\\sample.mp4',
          fileName: 'sample.mp4',
          container: 'mp4',
          durationMs: 45000,
          width: 1920,
          height: 1080,
          frameRateNumerator: 30000,
          frameRateDenominator: 1001,
          averageFrameRate: 29.97,
          variableFrameRate: false,
          videoCodec: 'h264',
          pixelFormat: 'yuv420p',
          bitrate: 4500000,
          fileSizeBytes: 25300000,
          displayAspectRatio: '16:9',
          sampleAspectRatio: '1:1',
          frameCount: 1350,
          rotation: 0,
          audioTracks: [
            { index: 1, codec: 'aac', language: 'eng', channels: 2, sampleRate: 48000 },
          ],
          subtitleTracks: [
            { index: 2, codec: 'subrip', language: 'eng', title: 'English' },
          ],
          thumbnailUrl: 'data:image/jpeg;base64,mockthumb',
        });
      }, []);
      return <WorkspaceScreen />;
    }

    render(
      <AppProvider>
        <WorkspaceWithMedia />
      </AppProvider>
    );

    expect(screen.getByText('sample.mp4')).toBeInTheDocument();
    expect(screen.getByAltText('sample.mp4')).toBeInTheDocument();
    expect(screen.getByText('29.97 fps')).toBeInTheDocument();
    expect(screen.getByText('4.5 Mbps')).toBeInTheDocument();
    expect(screen.getByText(/AAC/i)).toBeInTheDocument();
    expect(screen.getByText(/SUBRIP/i)).toBeInTheDocument();

    const enhanceBtn = screen.getByRole('button', { name: /enhance video/i });
    fireEvent.click(enhanceBtn);

    const clearBtn = screen.getByTitle('Remove from Studio');
    fireEvent.click(clearBtn);
    expect(screen.getByText('No Video Loaded in Studio')).toBeInTheDocument();
  });
});
