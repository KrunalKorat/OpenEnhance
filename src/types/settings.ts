export interface AppPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultOutputFolder?: string;
  tempDirectory?: string;
  concurrencyLimit: number;
  autoCleanTemp: boolean;
  prefersReducedMotion: boolean;
}
