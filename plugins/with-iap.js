const { withAppBuildGradle } = require("@expo/config-plugins");

module.exports = function withIAP(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes("missingDimensionStrategy 'store'")) {
      return config; // already patched
    }
    config.modResults.contents = config.modResults.contents.replace(
      /defaultConfig\s*\{/,
      `defaultConfig {\n            missingDimensionStrategy 'store', 'play'`
    );
    return config;
  });
};
