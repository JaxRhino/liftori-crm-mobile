// Mirrors the known-good liftop / liftori-mobile SDK-51 scaffold.
// If you ever hit "Cannot find module 'react-native-worklets/plugin'", swap the
// `nativewind/babel` preset for the inline css-interop form documented in the
// liftori-mobile skill (SDK 51 config section) and keep reanimated LAST.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: ["react-native-reanimated/plugin"],
  };
};
