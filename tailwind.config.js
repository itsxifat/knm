/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'], // For small UI text (Buttons, Inputs)
        serif: ['var(--font-cormorant)', 'serif'],   // For Body text (Paragraphs, Descriptions)
        heading: ['var(--font-cinzel)', 'serif'],    // For Titles (Royal feel)
      },
      colors: {
        // KNM Lifestyle Palette
        primary: {
          DEFAULT: "#0F2F24", // Deep Emerald Green (The new Black)
          foreground: "#F9F7F2", // Cream text
        },
        secondary: {
          DEFAULT: "#D4AF37", // Metallic Gold
          foreground: "#0F2F24",
        },
        accent: {
          DEFAULT: "#8B0000", // Deep Maroon (Royal Accent)
          foreground: "#FFFFFF",
        },
        background: "#F9F7F2", // Cream / Vellum
        surface: "#FFFFFF",    // Pure White for cards
        border: "#D4AF37",     // Gold borders
        muted: "#5C6B66",      // Sage Green (for secondary text)
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        DEFAULT: '0.25rem', // Keeping it slightly sharp for that "crisp" ironed look
        'md': '0.375rem',
        'lg': '0.5rem',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(to right, #D4AF37, #F2D06B, #B8860B)',
      }
    },
  },
  plugins: [],
};