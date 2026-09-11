import type { Config } from "tailwindcss";

// Dashboard colours are CSS variables (see app/globals.css) so the same class
// names render the light and dark palettes — `.dark` on <html> flips them.
// The `<alpha-value>` form keeps opacity modifiers (bg-capy-green/30) working.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

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
        // Themed dashboard palette
        "capy-bg": token("capy-bg"),
        "capy-card": token("capy-card"),
        "capy-surface": token("capy-surface"),
        "capy-surface-2": token("capy-surface-2"),
        "capy-border": token("capy-border"),
        "capy-text": token("capy-text"),
        "capy-muted": token("capy-muted"),
        "capy-green": token("capy-green"),
        "capy-green-dark": token("capy-green-dark"),
        "capy-green-light": token("capy-green-light"),
        "capy-accent": token("capy-accent"),
        "capy-accent-light": token("capy-accent-light"),
        // Legacy fixed colours (ordering product cards)
        "capy-dark": "#0F172A",
        "capy-darker": "#070E1F",
        "capy-brown": "#475569",
        "capy-tan": "#94A3B8",
        "capy-brown-accent": "#b88862",
        "capy-brown-accent-dark": "#9a6f4e",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.04), 0 1px 3px rgb(15 23 42 / 0.06)",
        "card-hover": "0 4px 12px rgb(15 23 42 / 0.08)",
      },
    },
  },
  plugins: [],
};
export default config;
