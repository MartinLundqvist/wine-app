/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cellar: {
          950: "#0E0B09",
          900: "#16110D",
          850: "#1D1612",
          800: "#241B16",
          700: "#332822",
        },
        linen: { 100: "#F6F1EA", 50: "#FBF8F3" },
        cork: { 500: "#8A735E", 400: "#A58B72", 300: "#C2AA92" },
        burgundy: {
          800: "#3B0F1D",
          700: "#571325",
          600: "#741A2F",
          200: "#E7C7CF",
          100: "#F2E3E7",
        },
        oak: {
          800: "#3A261B",
          700: "#4A3122",
          600: "#6B4632",
          300: "#C6A58B",
          200: "#E2CDBD",
        },
        brass: { 600: "#8B6A2B", 500: "#B08A3C", 200: "#E6D3A5" },
        candle: { 400: "#D6A56E", 200: "#F1D7B8" },
        moss: { 700: "#1E3B2E", 600: "#2E5743" },
        amber: { 600: "#9A5B1F" },
        oxblood: { 700: "#5C0E18" },
        slateblue: { 600: "#2C3F52" },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        ui: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.2" }],
        h1: ["32px", { lineHeight: "1.25" }],
        h2: ["24px", { lineHeight: "1.3" }],
        h3: ["20px", { lineHeight: "1.35" }],
        body: ["16px", { lineHeight: "1.5" }],
        small: ["14px", { lineHeight: "1.5" }],
        micro: ["12px", { lineHeight: "1.4" }],
      },
      spacing: {
        18: "72px",
        22: "88px",
      },
      borderRadius: {
        card: "16px",
        control: "12px",
        chip: "9999px",
      },
      boxShadow: {
        lift1: "0 2px 8px rgba(14, 11, 9, 0.15)",
        lift2: "0 4px 16px rgba(14, 11, 9, 0.2)",
      },
      transitionDuration: {
        fast: "120ms",
        base: "180ms",
        slow: "260ms",
      },
      transitionTimingFunction: {
        ritual: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
