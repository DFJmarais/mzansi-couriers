import React, { createContext, useContext, useEffect, useState } from "react";
import { isNightScheduleActive } from "@/lib/theme-schedule";

type Theme = "light" | "dark";
export type ThemeMode = Theme | "system";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
  toggleTheme?: () => void;
  scheduleEnabled: boolean;
  toggleSchedule?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({ children, defaultTheme = "light", switchable = false }: ThemeProviderProps) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (!switchable) return defaultTheme;
    const stored = localStorage.getItem("theme-mode");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    return localStorage.getItem("theme") === "dark" ? "dark" : "system";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (!switchable) return defaultTheme;
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : defaultTheme;
  });
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(() => {
    if (!switchable) return false;
    const stored = localStorage.getItem("theme-schedule");
    return stored === null ? true : stored === "on";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    if (switchable) localStorage.setItem("theme", theme);
  }, [theme, switchable]);

  useEffect(() => {
    if (!switchable) return;
    const applyMode = () => {
      if (themeMode === "system") {
        setTheme(window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      } else {
        setTheme(themeMode);
      }
    };
    applyMode();
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    media?.addEventListener?.("change", applyMode);
    return () => media?.removeEventListener?.("change", applyMode);
  }, [themeMode, switchable]);

  useEffect(() => {
    if (!switchable || !scheduleEnabled || themeMode === "system") return;
    const applySchedule = () => setTheme(isNightScheduleActive() ? "dark" : "light");
    applySchedule();
    const interval = window.setInterval(applySchedule, 60_000);
    return () => window.clearInterval(interval);
  }, [scheduleEnabled, switchable, themeMode]);

  useEffect(() => {
    if (switchable) localStorage.setItem("theme-schedule", scheduleEnabled ? "on" : "off");
  }, [scheduleEnabled, switchable]);

  const setThemeMode = switchable ? (mode: ThemeMode) => {
    setScheduleEnabled(false);
    setThemeModeState(mode);
    localStorage.setItem("theme-mode", mode);
  } : undefined;

  const toggleTheme = switchable ? () => setThemeMode?.(theme === "dark" ? "light" : "dark") : undefined;
  const toggleSchedule = switchable ? () => setScheduleEnabled(prev => !prev) : undefined;

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme, scheduleEnabled, toggleSchedule, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
