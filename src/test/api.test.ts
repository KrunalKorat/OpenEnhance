import { describe, it, expect } from 'vitest';
import { getAppInfo, getSystemCapabilities, normalizeAppError } from '@/lib/api';

describe('API Client & Types', () => {
  it('normalizes string errors into AppError structure', () => {
    const error = normalizeAppError('Disk full');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.message).toBe('Disk full');
    expect(error.retryable).toBe(false);
  });

  it('preserves existing AppError instances', () => {
    const original = {
      code: 'INPUT_UNREADABLE' as const,
      message: 'File cannot be read',
      retryable: true,
    };
    const error = normalizeAppError(original);
    expect(error.code).toBe('INPUT_UNREADABLE');
    expect(error.message).toBe('File cannot be read');
    expect(error.retryable).toBe(true);
  });

  it('returns valid app info in fallback mode', async () => {
    const info = await getAppInfo();
    expect(info.apiVersion).toBe(1);
    expect(info.storageSchemaVersion).toBe(1);
    expect(info.appVersion).toBeDefined();
  });

  it('returns structured system capabilities in fallback mode', async () => {
    const caps = await getSystemCapabilities();
    expect(caps.os).toBeDefined();
    expect(caps.architecture).toBeDefined();
    expect(Array.isArray(caps.engines)).toBe(true);
    expect(caps.engines.length).toBeGreaterThan(0);
    expect(caps.engines[0].engineId).toBe('realesrgan-ncnn-vulkan');
  });

  it('inspects media file and returns structured MediaInfo in fallback mode', async () => {
    const { inspectMedia } = await import('@/lib/api');
    const media = await inspectMedia('C:\\Videos\\sample.mp4');
    expect(media.width).toBe(1920);
    expect(media.height).toBe(1080);
    expect(media.fileName).toBe('sample.mp4');
    expect(media.videoCodec).toBe('h264');
    expect(media.frameRateNumerator).toBe(30000);
    expect(media.frameRateDenominator).toBe(1001);
    expect(media.audioTracks.length).toBeGreaterThan(0);
  });

  it('generates thumbnail data URL in fallback mode', async () => {
    const { generateThumbnail } = await import('@/lib/api');
    const thumb = await generateThumbnail('C:\\Videos\\sample.mp4');
    expect(thumb.startsWith('data:image/')).toBe(true);
  });

  it('picks video files in fallback mode', async () => {
    const { pickVideoFiles } = await import('@/lib/api');
    const files = await pickVideoFiles();
    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
  });
});
