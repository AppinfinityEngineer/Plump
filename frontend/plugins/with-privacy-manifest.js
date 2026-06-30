const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

function copyPrivacyManifest(config) {
  return withDangerousMod(config, [
    'ios',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const platformRoot = modConfig.modRequest.platformProjectRoot;
      const source = path.join(projectRoot, 'PrivacyInfo.xcprivacy');

      if (!fs.existsSync(source)) {
        throw new Error(`Missing PrivacyInfo.xcprivacy at ${source}`);
      }

      const projectName = modConfig.modRequest.projectName;
      const destinationDir = path.join(platformRoot, projectName);
      fs.mkdirSync(destinationDir, { recursive: true });
      fs.copyFileSync(source, path.join(destinationDir, 'PrivacyInfo.xcprivacy'));

      return modConfig;
    },
  ]);
}

module.exports = copyPrivacyManifest;
