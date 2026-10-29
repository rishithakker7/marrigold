/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Hover styles only apply on devices that can actually hover (no sticky hover on phones)
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        forest: {
          50: "#F4F7F4",
          100: "#E5ECE6",
          200: "#CBD9CD",
          300: "#A9BFAE",
          400: "#7F9C87",
          500: "#587A63",
          600: "#3F6450",
          700: "#2B523D",
          800: "#1C3B2B",
          900: "#0F241A",
          950: "#08150E",
        },
        gold: {
          100: "#FBF6E5",
          200: "#F4E7B8",
          300: "#E8D385",
          400: "#DCBE52",
          500: "#CBA627",
          600: "#B88E1B",
          700: "#946E14",
          800: "#705111",
          900: "#4A340B",
        },
        terracotta: {
          50: "#FAF2EE",
          100: "#F4E0D7",
          500: "#C85A32",
          600: "#AD4822",
          700: "#8B3718",
        },
        maroon: {
          700: "#78222F",
          800: "#5D1823",
          900: "#440F18",
        },
        cream: {
          50: "#FDFDFB",
          100: "#FAF9F5",
          200: "#F5F3EB",
          300: "#EAE6D7",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        gold: "0 20px 60px -20px rgba(203,166,39,0.45)",
        lift: "0 30px 60px -28px rgba(8,21,14,0.55)",
      },
    },
  },
  plugins: [],
};
