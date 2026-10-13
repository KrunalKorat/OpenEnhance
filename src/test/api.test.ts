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

  it('checks AI engine status and returns EngineStatus', async () => {
    const { getEngineStatus } = await import('@/lib/api');
    const status = await getEngineStatus();
    expect(status.engineId).toBe('realesrgan-ncnn-vulkan');
    expect(typeof status.available).toBe('boolean');
    expect(status.acceleration).toBe('vulkan');
  });

  it('lists installed and verified models', async () => {
    const { listModels } = await import('@/lib/api');
    const models = await listModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0].name).toBeDefined();
    expect(models[0].scale).toBeGreaterThanOrEqual(1);
  });

  it('plans output resolution maintaining aspect ratio', async () => {
    const { planResolution } = await import('@/lib/api');
    const plan = await planResolution(1920, 1080, '4k', 'contain', 4);
    expect(plan.targetWidth).toBe(3840);
    expect(plan.targetHeight).toBe(2160);
    expect(plan.modelScale).toBe(4);
    expect(plan.ffmpegFilter).toContain('scale=3840:2160');
  });

  it('runs enhancement workflow returning verified result in fallback mode', async () => {
    const { runEnhancement } = await import('@/lib/api');
    const result = await runEnhancement({
      inputPath: 'C:\\Videos\\sample.mp4',
      outputPath: 'C:\\Videos\\sample_4k.mp4',
      outputPreset: '4k',
      modelId: 'realesrgan-x4plus',
      qualityPreset: 'high',
      fitMode: 'contain',
      container: 'mp4',
      audioPolicy: 'preserve',
      subtitlePolicy: 'preserve-supported',
    });
    expect(result.actualWidth).toBe(3840);
    expect(result.actualHeight).toBe(2160);
    expect(result.videoCodec).toBe('h264');
    expect(result.audioTracksCount).toBeGreaterThanOrEqual(0);
  });

  it('reveals output in folder safely', async () => {
    const { revealInFolder } = await import('@/lib/api');
    await expect(revealInFolder('C:\\Videos\\sample_4k.mp4')).resolves.toBeUndefined();
  });

  it('creates and manages persistent jobs in queue', async () => {
    const {
      createJob,
      listJobs,
      getJob,
      cancelJob,
      retryJob,
      clearCompletedJobs,
      recoverJobs,
    } = await import('@/lib/api');

    const created = await createJob({
      inputPath: 'C:\\Videos\\sample.mp4',
      outputPath: 'C:\\Videos\\sample_4k.mp4',
      fileName: 'sample.mp4',
      inputWidth: 1920,
      inputHeight: 1080,
      resolutionPreset: '4k',
      model: 'realesrgan-x4plus',
      encoder: 'libx264',
      qualityPreset: 'high',
      fitMode: 'contain',
      container: 'mp4',
      audioPolicy: 'preserve',
      subtitlePolicy: 'preserve-supported',
    });

    expect(created.id).toBeDefined();
    expect(created.state).toBe('queued');
    expect(created.resolutionPreset).toBe('4k');

    const list = await listJobs();
    expect(list.length).toBeGreaterThan(0);
    expect(list.some((j) => j.id === created.id)).toBe(true);

    const retrieved = await getJob(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);

    const cancelled = await cancelJob(created.id);
    expect(cancelled.state).toBe('cancelled');

    const retried = await retryJob(created.id);
    expect(retried.state).toBe('queued');

    const recovered = await recoverJobs('retry');
    expect(Array.isArray(recovered)).toBe(true);

    const cleared = await clearCompletedJobs();
    expect(typeof cleared).toBe('number');
  });
});
