import { describe, it, expect } from 'vitest';
import { formatBytes, formatDuration } from '@/lib/formatting';

describe('Formatting Utilities', () => {
  it('formats byte values accurately', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
    expect(formatBytes(52428800, 2)).toBe('50 MB');
  });

  it('formats duration in milliseconds accurately', () => {
    expect(formatDuration(0)).toBe('00:00');
    expect(formatDuration(45000)).toBe('00:45');
    expect(formatDuration(125000)).toBe('02:05');
    expect(formatDuration(3665000)).toBe('1:01:05');
  });
});
