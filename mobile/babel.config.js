module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@app': './src/app',
          '@core': './src/core',
          '@features': './src/features',
          '@components': './src/components',
          '@theme': './src/theme',
        },
      },
    ],
  ],
};
