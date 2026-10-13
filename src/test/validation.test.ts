import { describe, it, expect } from 'vitest';
import { isSupportedMediaExtension, getPresetDimensions } from '@/lib/validation';

describe('Media & Preset Validation', () => {
  it('correctly identifies valid media extensions', () => {
    expect(isSupportedMediaExtension('video.mp4')).toBe(true);
    expect(isSupportedMediaExtension('/path/to/clip.MKV')).toBe(true);
    expect(isSupportedMediaExtension('test.mov')).toBe(true);
    expect(isSupportedMediaExtension('animation.webm')).toBe(true);
  });

  it('rejects unsupported extensions', () => {
    expect(isSupportedMediaExtension('photo.jpg')).toBe(false);
    expect(isSupportedMediaExtension('audio.mp3')).toBe(false);
    expect(isSupportedMediaExtension('document.pdf')).toBe(false);
    expect(isSupportedMediaExtension('script.sh')).toBe(false);
  });

  it('maps output presets to exact dimensions per PRD', () => {
    expect(getPresetDimensions('1080p')).toEqual({ width: 1920, height: 1080 });
    expect(getPresetDimensions('1440p')).toEqual({ width: 2560, height: 1440 });
    expect(getPresetDimensions('4k')).toEqual({ width: 3840, height: 2160 });
  });
});
