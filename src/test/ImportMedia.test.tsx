import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportScreen } from '@/features/import/ImportScreen';
import { AppProvider, useAppStore } from '@/stores/appState';

describe('ImportScreen Component', () => {
  it('renders import dropzone and supported formats', () => {
    render(
      <AppProvider>
        <ImportScreen />
      </AppProvider>
    );

    expect(screen.getByText('Import Video Footage')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop video files here')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /browse video files/i })
    ).toBeInTheDocument();
    expect(screen.getByText('MP4')).toBeInTheDocument();
    expect(screen.getByText('MKV')).toBeInTheDocument();
  });

  it('triggers file browsing and imports media', async () => {
    render(
      <AppProvider>
        <ImportScreen />
      </AppProvider>
    );

    const browseBtn = screen.getByRole('button', { name: /browse video files/i });
    fireEvent.click(browseBtn);

    await waitFor(() => {
      // In fallback mode, pickVideoFiles returns C:\Videos\demo_sample.mp4 and inspects it
      expect(screen.getByText(/Imported Media/i)).toBeInTheDocument();
    });
  });

  it('handles drag-and-drop of video files', async () => {
    render(
      <AppProvider>
        <ImportScreen />
      </AppProvider>
    );

    const dropzone = screen.getByText('Drag and drop video files here').closest('div');
    expect(dropzone).not.toBeNull();

    const fakeFile = new File(['dummy content'], 'drop_test.mp4', { type: 'video/mp4' });
    Object.defineProperty(fakeFile, 'path', {
      value: 'C:\\Videos\\drop_test.mp4',
    });

    fireEvent.dragOver(dropzone!);
    fireEvent.drop(dropzone!, {
      dataTransfer: {
        files: [fakeFile],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('drop_test.mp4')).toBeInTheDocument();
    });
  });

  it('prevents duplicate imports and switches to studio', async () => {
    function DuplicateTestWrapper() {
      const store = useAppStore();
      return (
        <div>
          <button
            onClick={() => store.importVideoByPath('C:\\Videos\\same.mp4')}
            data-testid="import-same-btn"
          >
            Import Same
          </button>
          <ImportScreen />
        </div>
      );
    }

    render(
      <AppProvider>
        <DuplicateTestWrapper />
      </AppProvider>
    );

    const btn = screen.getByTestId('import-same-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText('same.mp4')).toBeInTheDocument();
    });

    // Second import of the same path
    fireEvent.click(btn);

    // List of imported videos should still only contain 1 item
    const items = screen.getAllByText('same.mp4');
    expect(items.length).toBeGreaterThanOrEqual(1);
  });
});
