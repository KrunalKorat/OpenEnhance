import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SegmentedControl } from '@/components/SegmentedControl';

describe('SegmentedControl Component', () => {
  it('renders all options and responds to clicks', () => {
    const handleChange = vi.fn();
    const options = [
      { value: '1080p', label: '1080p' },
      { value: '1440p', label: '1440p' },
      { value: '4k', label: '4K' },
    ];

    render(
      <SegmentedControl
        options={options}
        value="1080p"
        onChange={handleChange}
        ariaLabel="Resolution"
      />
    );

    const option4k = screen.getByRole('radio', { name: /4k/i });
    expect(option4k).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(option4k);
    expect(handleChange).toHaveBeenCalledWith('4k');
  });
});
