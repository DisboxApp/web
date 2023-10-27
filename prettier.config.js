// prettier.config.js
module.exports = {
    plugins: ['prettier-plugin-tailwindcss'],
    tailwindAttributes: ['myClassList'],
    tailwindConfig: './tailwind.config.js',
    formatOnSave: true,
    useTabs: false,
    tabWidth: 2,
    semi: true,
    singleQuote: true,
    jsxSingleQuote: true,
  }