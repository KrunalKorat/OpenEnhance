import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';

describe('App Navigation and UI Shell', () => {
  it('renders application brand and switches between all navigation screens', () => {
    render(<App />);

    expect(screen.getByText('OpenEnhance')).toBeInTheDocument();

    // Click Import nav item
    const navButtons = screen.getAllByRole('button');
    const importNavBtn = navButtons.find((btn) => btn.textContent?.includes('Import'));
    expect(importNavBtn).toBeDefined();
    fireEvent.click(importNavBtn!);
    expect(screen.getByText('Import Video Footage')).toBeInTheDocument();

    // Click Queue nav item
    const queueNavBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('Queue'));
    expect(queueNavBtn).toBeDefined();
    fireEvent.click(queueNavBtn!);
    expect(screen.getByText('Batch Processing Queue')).toBeInTheDocument();

    // Click History nav item
    const historyNavBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('History'));
    expect(historyNavBtn).toBeDefined();
    fireEvent.click(historyNavBtn!);
    expect(screen.getByText('Enhancement History')).toBeInTheDocument();

    // Click Settings nav item
    const settingsNavBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('Settings'));
    expect(settingsNavBtn).toBeDefined();
    fireEvent.click(settingsNavBtn!);
    expect(screen.getByText('Settings & Hardware Diagnostics')).toBeInTheDocument();

    // Click Workspace back
    const workspaceNavBtn = screen
      .getAllByRole('button')
      .find((btn) => btn.textContent?.includes('Workspace'));
    expect(workspaceNavBtn).toBeDefined();
    fireEvent.click(workspaceNavBtn!);
    expect(screen.getByText('Target Resolution')).toBeInTheDocument();
  });

  it('opens and closes keyboard shortcuts modal', () => {
    render(<App />);

    const shortcutBtns = screen.getAllByRole('button', { name: /shortcuts/i });
    fireEvent.click(shortcutBtns[0]);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });
});
