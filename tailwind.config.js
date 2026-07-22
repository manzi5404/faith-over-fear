/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./*.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'DOTTIE-black': '#000000',
                'DOTTIE-dark': '#0a0a0a',
                'DOTTIE-gray': '#1a1a1a',
                'DOTTIE-accent': '#60a5fa',
                'DOTTIE-white': '#f5f5f5',
                'DOTTIE-blue': '#60a5fa',
                'DOTTIE-blue-hover': '#3b82f6',
                'DOTTIE-green': '#4b5320',
                'DOTTIE-green-hover': '#3d4219',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // We will import Inter in CSS
                display: ['Oswald', 'sans-serif'], // Good for street headings
            },
            animation: {
                'float': 'float 3s ease-in-out infinite',
                'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
                'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}

