import type { CliOptions } from 'electron-builder';
import { build as electronBuild } from 'electron-builder';
import { run } from 'shell-commands';

const pack = async (target: 'mas-dev' | 'mas') => {
  await run(`
    rm -rf .parcel-cache
    rm -rf build
    parcel build --no-source-maps

    cp *.plist build/
    cp ${target}.provisionprofile build/
    rm -rf dist
  `);

  const options: CliOptions = {
    universal: true,
    config: {
      appId: 'app.macmate.assets-hosting',
      copyright: `Copyright © ${new Date().getFullYear()} MacMate.app`,
      files: ['build'],
      mac: {
        category: 'public.app-category.graphics-design',
        target: [target],
        provisioningProfile: `build/${target}.provisionprofile`,
        entitlements: 'build/entitlements.mac.plist',
        entitlementsInherit: 'build/entitlements.mac.inherit.plist',
        extendInfo: {
          ITSAppUsesNonExemptEncryption: false,
        },
      },
    },
  };

  await electronBuild(options);
};

const inputs = new Set(process.argv);
if (inputs.has('--dev')) {
  pack('mas-dev');
} else {
  pack('mas');
}
