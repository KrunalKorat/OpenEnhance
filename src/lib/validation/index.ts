// Validation library for OpenEnhance
import { OUTPUT_DIMENSIONS, type OutputPreset } from '@/types/api';

/**
 * Validates whether a file extension is in the supported candidate media set.
 */
export function isSupportedMediaExtension(filePath: string): boolean {
  const supported = ['.mp4', '.mov', '.mkv', '.webm', '.avi'];
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return supported.includes(ext);
}

/**
 * Returns exact dimensions for a supported target preset.
 */
export function getPresetDimensions(preset: OutputPreset): {
  width: number;
  height: number;
} {
  return OUTPUT_DIMENSIONS[preset];
}
