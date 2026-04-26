module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inline `.sql` files as string literals at build time so Drizzle
      // migrations can be bundled into the app without a runtime fs read.
      ['inline-import', { extensions: ['.sql'] }],
    ],
  };
};
