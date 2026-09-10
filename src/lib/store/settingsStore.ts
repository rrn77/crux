import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserSettings } from '../types';

interface SettingsStore extends UserSettings {
  setSoundEnabled: (enabled: boolean) => void;
  setVibrationEnabled: (enabled: boolean) => void;
  setDarkMode: (enabled: boolean) => void;
  toggleDarkMode: () => void;
  setAutoStartRest: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      soundEnabled: true,
      vibrationEnabled: true,
      darkMode: false,
      autoStartRest: true,
      voiceCountdown: false,

      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setVibrationEnabled: (vibrationEnabled) => set({ vibrationEnabled }),
      setDarkMode: (darkMode) => set({ darkMode }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setAutoStartRest: (autoStartRest) => set({ autoStartRest }),
    }),
    {
      name: 'crux-user-settings',
    }
  )
);
