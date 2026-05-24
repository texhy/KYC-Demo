import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // DCF brand palette, taken from the logo.
        brand: {
          grey: "#9aa0a6",
          crimson: "#a4123f",
          teal: "#a6dcd8",
          navy: "#0f1729",
          "navy-2": "#172033",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        pulse2: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        pulse2: "pulse2 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
