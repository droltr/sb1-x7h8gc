export const StorageKeys = {
  SETTINGS: 'fortigate_settings',
  MOCK_MODE: 'fortigate_mock_mode',
} as const;

export function saveSettings(settings: unknown): void {
  localStorage.setItem(StorageKeys.SETTINGS, JSON.stringify(settings));
}

export function loadSettings<T>(): T | null {
  const data = localStorage.getItem(StorageKeys.SETTINGS);
  return data ? JSON.parse(data) : null;
}

export function saveMockMode(enabled: boolean): void {
  localStorage.setItem(StorageKeys.MOCK_MODE, JSON.stringify(enabled));
}

export function loadMockMode(): boolean {
  const data = localStorage.getItem(StorageKeys.MOCK_MODE);
  return data ? JSON.parse(data) : true;
}