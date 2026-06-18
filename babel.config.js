// Mirrors the known-good liftop / liftori-mobile SDK-51 scaffold.
// babel-preset-expo auto-injects react-native-reanimated's babel transform, which
// pulls in react-native-worklets/plugin — not installed in this dep set and not
// needed for the web preview bundle (react-native-web handles reanimated at
// runtime). We pass `reanimated: false` so `npx expo export --platform web`
// resolves cleanly. Re-enable it (and install react-native-worklets) before
// running native EAS builds.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", reanimated: false }],
      "nativewind/babel",
    ],
  };
};
