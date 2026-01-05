/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1a73e8", // Google Blue
                secondary: "#34a853", // Google Green
                accent: "#fbbc04", // Google Yellow
                danger: "#ea4335", // Google Red
                glass: "rgba(255, 255, 255, 0.7)",
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
