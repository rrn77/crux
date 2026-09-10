import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terracotta: {
          50: "#FFF5F2",
          100: "#FFE8E1",
          200: "#FFD3C4",
          300: "#FFAF96",
          400: "#F57D5B",
          500: "#D9532F",
          600: "#C0421F",
          700: "#9E3417",
          800: "#7F2C15",
          900: "#682816",
          DEFAULT: "#D9532F",
        },
        moss: {
          50: "#F3F8F3",
          100: "#E3EFE4",
          200: "#C8DFC9",
          300: "#A2C6A4",
          400: "#75A578",
          500: "#4E8252",
          600: "#3D6941",
          700: "#325335",
          800: "#2B432D",
          900: "#243726",
          DEFAULT: "#4E8252",
        },
        chalk: {
          50: "#FAF9F5",
          100: "#F4F1EA",
          200: "#EAE5D9",
          300: "#DAD3C1",
          400: "#C4BBA5",
          500: "#AEA28B",
          600: "#968A73",
          700: "#7C715D",
          800: "#655D4D",
          900: "#534C3F",
          DEFAULT: "#F4F1EA",
        },
        graphite: {
          50: "#F6F7F8",
          100: "#ECEDF0",
          200: "#D5D8DC",
          300: "#B0B6BE",
          400: "#848D9A",
          500: "#636E7D",
          600: "#4D5663",
          700: "#3E444E",
          800: "#2B2F36",
          900: "#181B1E",
          950: "#0F1113",
          DEFAULT: "#181B1E",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      keyframes: {
        pulseFast: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        scaleUp: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-fast": "pulseFast 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scale-up": "scaleUp 0.15s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
