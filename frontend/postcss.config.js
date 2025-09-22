module.exports = (ctx) => ({
  plugins: {
    // Only run Tailwind on our utilities entry to avoid parsing precompiled CSS in index.css
    tailwindcss: ctx?.file?.basename === 'tw-utilities.css' ? {} : false,
    autoprefixer: {},
  },
});
