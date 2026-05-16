const STORAGE_KEY = 'ma-app-ui-light';

export function readAppUiLightModeFromStorage(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeAppUiLightModeToStorage(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    /* úložiště nedostupné */
  }
}
