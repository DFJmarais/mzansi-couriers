export type SurfaceContrastToken = {
  name: string;
  foreground: string;
  background: string;
  minimumRatio: number;
};

export const mobileSurfaceContrastTokens: SurfaceContrastToken[] = [
  { name: "light body text", foreground: "#17151f", background: "#faf8f1", minimumRatio: 4.5 },
  { name: "light card text", foreground: "#17151f", background: "#ffffff", minimumRatio: 4.5 },
  { name: "light muted text", foreground: "#707078", background: "#faf8f1", minimumRatio: 4.5 },
  { name: "light primary button", foreground: "#ffffff", background: "#287a56", minimumRatio: 4.5 },
  { name: "dark body text", foreground: "#f7f5e7", background: "#111c1a", minimumRatio: 4.5 },
  { name: "dark card text", foreground: "#ede9d9", background: "#1a2926", minimumRatio: 4.5 },
  { name: "dark muted text", foreground: "#d6d5c9", background: "#111c1a", minimumRatio: 4.5 },
  { name: "dark primary button", foreground: "#102018", background: "#b8d96b", minimumRatio: 4.5 },
];

function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string) {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
}

export function contrastRatio(foreground: string, background: string) {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export function assertMobileSurfaceContrast() {
  return mobileSurfaceContrastTokens.map((token) => ({
    ...token,
    ratio: contrastRatio(token.foreground, token.background),
    passes: contrastRatio(token.foreground, token.background) >= token.minimumRatio,
  }));
}
