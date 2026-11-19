const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Expo Config Plugin to mark non-essential hardware features as optional in AndroidManifest.xml.
 *
 * This prevents Google Play from restricting the app from devices that don't have
 * portrait-locked physical hardware (e.g. Tablets, Foldables in unfolded mode,
 * Chromebooks, and Android XR headsets).
 */
const withOptionalHardwareFeatures = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest["uses-feature"]) {
      androidManifest["uses-feature"] = [];
    }

    const optionalFeatures = [
      "android.hardware.screen.portrait",
      "android.hardware.camera",
      "android.hardware.camera.autofocus",
    ];

    for (const featureName of optionalFeatures) {
      const existing = androidManifest["uses-feature"].find(
        (f) => f.$ && f.$["android:name"] === featureName
      );

      if (existing) {
        existing.$["android:required"] = "false";
      } else {
        androidManifest["uses-feature"].push({
          $: {
            "android:name": featureName,
            "android:required": "false",
          },
        });
      }
    }

    return config;
  });
};

module.exports = withOptionalHardwareFeatures;
