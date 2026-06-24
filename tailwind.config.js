/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#effaf6",
          100: "#d9f4e8",
          500: "#11b981",
          600: "#0c8a60",
          700: "#0b6f4f"
        }
      },
      boxShadow: {
        panel: "0 24px 80px rgba(15, 23, 42, 0.28)"
      },
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui"]
      }
    },
  },
  plugins: [],
};
