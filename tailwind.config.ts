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
        brand: {
          bg: "#f2fdf6",
          dark: "#1a7a44",
          mint: "#3ecf82",
          mid: "#2d9e5a",
          pink: "#d42b4f",
          text: "#0f3a20",
        },
        coffee: {
          50: "#f2fdf6", 100: "#d1f5e0", 200: "#a3ebc1", 300: "#6ddb9a",
          400: "#3ecf82", 500: "#2d9e5a", 600: "#1a7a44", 700: "#156335",
          800: "#104d29", 900: "#0f3a20", 950: "#072113",
        },
        cream: { 50: "#f7fef9", 100: "#eafcf0", 200: "#d5f7e2", 300: "#b8f0cc" },
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
