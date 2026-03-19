import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "/styles/global.css",
  ],
  theme: {
    extend: {
      animation: { /* ... unchanged ... */ },
      keyframes: { /* ... unchanged ... */ },
      fontFamily: {
        sans: ["Switzer", "sans-serif"],
        acid: ["acid", "sans-serif"],
      },
      fontSize: { /* ... unchanged ... */ },

      // ✅ Move colors here — extends instead of replacing defaults
      colors: {
        sectionBlack: "#2B2B2B",
        buttonBlack: "#C53434",
        buttonBlackOff: "#383838",
        buttonBlackHovered: "#3F3F3F",
        red: "#DA1313",
        redDark: "#C53434",
        footerRed: "#8B222A",
        buttonRedDark: "#9C2828",
        borderRedCardFocus: "#99444B",
        greyLight: "#7F7F7F",
        greyDark: "#FAFAFA",
        buttonGreyHover: "#D2D2D2",
        buttonGreyDisabled: "#E4E4E4",
        buttonGreyDisabledText: "#C7C5C5",
        borderGreyDisabledFocus: "#C4C4C4",
        borderGrey: "#E7E7E7",
        pivotBlue: "#0449B0",
        pivotBlueDark: "#04347B",
        Discord: "#7289DA",
        Instagram: "#DD2A7B",
        LinkedIn: "#0077B5",
      },
    },
  },
  plugins: [],
};
export default config;