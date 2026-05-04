import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    borderRadius: {
      none: "0",
      sm: "2px",
      DEFAULT: "4px",
      md: "6px",
      lg: "8px",
      xl: "10px",
      "2xl": "12px",
      "3xl": "16px",
      full: "9999px",
    },
    extend: {
      fontFamily: {
        sans: ["Helvetica", "Arial", "sans-serif"],
        helvetica: ["Helvetica", "Arial", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "capy-bg": "#ffffffff",
        "capy-card": "#FFFFFF",
        "capy-dark": "#0F172A",
        "capy-darker": "#070E1F",
        "capy-brown": "#475569",
        "capy-tan": "#94A3B8",
        "capy-muted": "#64748B",
        "capy-green": "#22C55E",
        "capy-green-dark": "#16A34A",
        "capy-green-light": "#DCFCE7",
        "capy-border": "#CBD5E1",
        "capy-text": "#0F172A",
        "capy-brown-accent": "#b88862",
        "capy-brown-accent-dark": "#9a6f4e",
      },
    },
  },
  plugins: [],
};
export default config;
