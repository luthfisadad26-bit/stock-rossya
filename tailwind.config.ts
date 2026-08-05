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
        navy: {
          DEFAULT: "#1F2D50",
          50: "#f3f5f9",
          100: "#e4e8f2",
          800: "#1A2542",
          900: "#1F2D50",
        },
        maroon: {
          DEFAULT: "#8B2E3F",
          50: "#fdf2f4",
          100: "#fbe6e9",
          600: "#8B2E3F",
          700: "#752433",
          800: "#5e1c28",
        },
        khaki: {
          DEFAULT: "#D9C9A3",
          100: "#f7f4ec",
          200: "#eee7d5",
          300: "#D9C9A3",
          700: "#695D3E",
        },
        offwhite: "#FAF9F4",
        "card-border": "#E6E1D3",
      },
      fontFamily: {
        heading: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
