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
        // Core SaaS palette
        ink: {
          950: "#06080F",
          900: "#0B0F1A",
          850: "#0F1422",
          800: "#131A2B",
          700: "#1A2338",
          600: "#243049",
        },
        gold: {
          100: "#FDF3D7",
          200: "#FAE3A3",
          300: "#F7D06B",
          400: "#F2B93B",
          500: "#E09F1F",
          600: "#B87D12",
        },
        bull: {
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
        },
        bear: {
          300: "#FDA4AF",
          400: "#FB7185",
          500: "#F43F5E",
        },
        // Legacy tokens (admin + legal pages) remapped onto the new palette
        terminal: {
          black: "#06080F",
          surface: "#0B0F1A",
          card: "#131A2B",
          border: "#1F2A40",
          green: "#34D399",
          red: "#FB7185",
          gold: "#F2B93B",
          subtext: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -24px rgba(0,0,0,0.6)",
        gold: "0 10px 30px -10px rgba(242,185,59,0.55)",
        glow: "0 0 0 1px rgba(242,185,59,0.25), 0 20px 60px -20px rgba(242,185,59,0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "flash-up": {
          "0%": { color: "#34D399" },
          "100%": { color: "inherit" },
        },
        "flash-down": {
          "0%": { color: "#FB7185" },
          "100%": { color: "inherit" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.3s ease-out both",
        "scale-in": "scale-in 0.25s ease-out both",
        shimmer: "shimmer 2.2s linear infinite",
        "flash-up": "flash-up 1s ease-out",
        "flash-down": "flash-down 1s ease-out",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
