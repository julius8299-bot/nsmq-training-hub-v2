import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#13231c",
        cream: "#f6f1e6",
        gold: "#e9a928",
        maths: "#3157b7",
        physics: "#7048a8",
        chemistry: "#07886f",
        biology: "#b94b43",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(19, 35, 28, 0.09)",
      },
      fontFamily: {
        sans: ["var(--font-body)", "Arial", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
