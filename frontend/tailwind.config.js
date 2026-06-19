/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 温暖珊瑚红：艺术作品展示的"主色"（替代之前的纯血红）
        primary: {
          50: '#fff7f6',
          100: '#fdeae6',
          200: '#fad1c9',
          300: '#f5ac9d',
          400: '#ed7e66',
          500: '#e45a3e',
          600: '#cf3a1e',
          700: '#ad2d14',
          800: '#8f2816',
          900: '#772518',
        },
        // 琥珀金：与珊瑚红搭配的强调色（替代之前清冷的蓝色）
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      }
    },
  },
  plugins: [],
};
