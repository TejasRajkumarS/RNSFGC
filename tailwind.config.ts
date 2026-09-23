import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      colors: {
        ink: "#0b1c2c",
        paper: "#faf8f4",
        sand: "#f1ece3",
        sky: "#dbe9f1",
        navy: {
          DEFAULT: "#14304d",
          50: "#f2f6fa",
          100: "#e2eaf2",
          200: "#c3d3e2",
          300: "#97b2cb",
          400: "#648dad",
          500: "#426f92",
          600: "#2f5678",
          700: "#284762",
          800: "#1d3850",
          900: "#122a40",
          950: "#0b1c2c",
        },
        gold: {
          DEFAULT: "#c9a24b",
          light: "#e3c682",
          dark: "#a9853a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(11 28 44 / 0.05), 0 8px 24px -12px rgb(11 28 44 / 0.14)",
        lift: "0 2px 6px rgb(11 28 44 / 0.07), 0 18px 44px -18px rgb(11 28 44 / 0.28)",
      },
    },
  },
  plugins: [],
};

export default config;
