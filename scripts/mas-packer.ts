import type { CliOptions } from 'electron-builder';
import { build as electronBuild } from 'electron-builder';
import { run } from 'shell-commands';

import build from './build';

export const pack = async (target: 'mas-dev' | 'mas') => {
  await build();

  await run(`
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
