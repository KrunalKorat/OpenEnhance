import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EnvironmentStatus } from '@/components/EnvironmentStatus';
import type { AppInfo, SystemCapabilities } from '@/types/api';

describe('EnvironmentStatus Component', () => {
  const mockAppInfo: AppInfo = {
    appVersion: '0.1.0',
    apiVersion: 1,
    os: 'windows',
    architecture: 'x86_64',
    storageSchemaVersion: 1,
  };

  const mockCaps: SystemCapabilities = {
    os: 'windows',
    architecture: 'x86_64',
    ffmpegAvailable: true,
    ffmpegVersion: 'ffmpeg version 6.0',
    ffprobeAvailable: true,
    ffprobeVersion: 'ffprobe version 6.0',
    vulkanAvailable: true,
    vulkanDevice: 'NVIDIA RTX 3080',
    engines: [
      {
        engineId: 'realesrgan-ncnn-vulkan',
        engineVersion: 'candidate-adapter',
        available: true,
        platform: 'windows',
        acceleration: 'vulkan',
        models: [],
        supportsCancellation: true,
        supportsProgress: true,
        supportedOperations: ['upscale'],
        warnings: [],
      },
    ],
    warnings: [],
  };

  it('renders application metadata and ready indicators', () => {
    render(
      <EnvironmentStatus
        appInfo={mockAppInfo}
        capabilities={mockCaps}
        loading={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('Environment & System Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Vulkan Enabled')).toBeInTheDocument();
    expect(screen.getByText('Phase 1 Foundation Operational')).toBeInTheDocument();
  });

  it('renders warnings when present in capabilities', () => {
    const capsWithWarning: SystemCapabilities = {
      ...mockCaps,
      warnings: ['Vulkan runtime not detected on system PATH'],
    };

    render(
      <EnvironmentStatus
        appInfo={mockAppInfo}
        capabilities={capsWithWarning}
        loading={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText('System Capability Warnings')).toBeInTheDocument();
    expect(
      screen.getByText('Vulkan runtime not detected on system PATH')
    ).toBeInTheDocument();
  });
});
