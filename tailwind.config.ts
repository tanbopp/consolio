import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#E3E7EA",
        input: "#E3E7EA",
        ring: "#17685F",
        background: "#F6F7F8",
        surface: "#FFFFFF",
        foreground: "#182126",
        secondary: {
          DEFAULT: "#626E76",
          foreground: "#182126",
        },
        primary: {
          DEFAULT: "#17685F",
          foreground: "#FFFFFF",
          hover: "#10534C",
          subtle: "#EDF5F4",
        },
        accent: {
          DEFAULT: "#17685F",
          foreground: "#FFFFFF",
          hover: "#10534C",
        },
        success: {
          DEFAULT: "#20734D",
          subtle: "#EAF5EF",
          foreground: "#144D33",
        },
        warning: {
          DEFAULT: "#9A6700",
          subtle: "#FEF7E6",
          foreground: "#734C00",
        },
        danger: {
          DEFAULT: "#B42318",
          subtle: "#FDF2F1",
          foreground: "#911D13",
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        sm: "4px",
        md: "6px",
        lg: "8px",
      },
      fontSize: {
        xs: ["12px", "16px"],
        sm: ["13px", "18px"],
        base: ["14px", "20px"],
        lg: ["16px", "24px"],
        xl: ["18px", "26px"],
        "2xl": ["22px", "28px"],
        "3xl": ["26px", "32px"],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
