import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./actions/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          black: "#0B0E14",
          surface: "#121824",
          card: "#182030",
          border: "#243048",
          green: "#00E676",
          red: "#FF334B",
          gold: "#F59E0B",
          subtext: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
