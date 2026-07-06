import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0708",
          900: "#0f0b0d",
          800: "#15100f",
          700: "#1e1715",
          600: "#2a201d",
        },
        ember: {
          DEFAULT: "#e6a15a",
          soft: "#f0c088",
          deep: "#c47a2f",
        },
        neon: {
          DEFAULT: "#ff2d3a",
          soft: "#ff5a63",
          glow: "#ff0a1a",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(255,45,58,0.45)",
        ember: "0 0 60px -12px rgba(230,161,90,0.35)",
        card: "0 24px 60px -20px rgba(0,0,0,0.75)",
      },
      backgroundImage: {
        "radial-ember": "radial-gradient(circle at 50% 30%, rgba(230,161,90,0.15), transparent 60%)",
        "smoke": "radial-gradient(ellipse at bottom, rgba(255,45,58,0.08), transparent 70%)",
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.92" },
          "50%": { opacity: "0.7" },
          "55%": { opacity: "0.95" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        flicker: "flicker 4s ease-in-out infinite",
        floaty: "floaty 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
