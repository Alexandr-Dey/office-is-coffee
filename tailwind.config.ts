import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: "#fdf8f0", 100: "#f9eddb", 200: "#f2d7b0", 300: "#e9bb7c",
          400: "#df9a48", 500: "#d4802a", 600: "#c06520", 700: "#9f4c1d",
          800: "#803e1f", 900: "#6a351d", 950: "#3a1a0d",
        },
        cream: { 50: "#fefcf7", 100: "#fdf6ea", 200: "#faecd0", 300: "#f5dcab" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
