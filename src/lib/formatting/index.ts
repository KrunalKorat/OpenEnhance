/**
 * Formats bytes into human-readable representation.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats milliseconds into mm:ss or hh:mm:ss string.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Formats frame rate into human-readable fps string.
 */
export function formatFrameRate(
  numerator?: number,
  denominator?: number,
  average?: number
): string {
  if (numerator && denominator && denominator > 0) {
    const fps = numerator / denominator;
    return `${fps.toFixed(fps % 1 === 0 ? 0 : 2)} fps`;
  }
  if (average && average > 0) {
    return `${average.toFixed(average % 1 === 0 ? 0 : 2)} fps`;
  }
  return 'Unknown fps';
}

/**
 * Formats bits per second into human-readable rate.
 */
export function formatBitrate(bps?: number): string {
  if (!bps || bps <= 0) return 'Unknown';
  if (bps >= 1_000_000) {
    return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  }
  return `${Math.round(bps / 1000)} kbps`;
}
