// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  'ctrl+d': 'toggle-dark-mode',
  'ctrl+r': 'refresh-dashboard',
  'ctrl+e': 'export-dashboard',
  'ctrl+s': 'open-settings',
  'escape': 'close-modals'
} as const;

// Available restaurant locations
export const LOCATIONS = [
  'Berlin Mitte',
  'Berlin Prenzlauer Berg',
  'Berlin Charlottenburg',
  'Berlin Kreuzberg'
] as const;

// Critical widgets for preloading
export const CRITICAL_WIDGETS = [
  'orders-revenue',
  'reservations',
  'visibility-score'
] as const;