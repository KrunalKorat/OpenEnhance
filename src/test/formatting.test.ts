import { describe, it, expect } from 'vitest';
import {
  formatBytes,
  formatDuration,
  formatFrameRate,
  formatBitrate,
} from '@/lib/formatting';

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

  it('formats frame rates accurately', () => {
    expect(formatFrameRate(30000, 1001)).toBe('29.97 fps');
    expect(formatFrameRate(24000, 1001)).toBe('23.98 fps');
    expect(formatFrameRate(60, 1)).toBe('60 fps');
    expect(formatFrameRate(undefined, undefined, 25)).toBe('25 fps');
    expect(formatFrameRate()).toBe('Unknown fps');
  });

  it('formats bitrates accurately', () => {
    expect(formatBitrate(0)).toBe('Unknown');
    expect(formatBitrate(500000)).toBe('500 kbps');
    expect(formatBitrate(4500000)).toBe('4.5 Mbps');
    expect(formatBitrate(12000000)).toBe('12.0 Mbps');
  });
});
