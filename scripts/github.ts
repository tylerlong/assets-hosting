import { build as electronBuild } from 'electron-builder';
import { run } from 'shell-commands';

import build from './build';

const main = async () => {
  await build();
  await run('rm -rf dist');
  const files = ['build'];
  // release macOS versions
  await electronBuild({
    arm64: true,
    x64: true,
    universal: true,
    mac: ['default'],
    config: {
      files,
      // publish: null, // publish or not
      mac: {
        // identity: null, // code sign or not
        notarize: {
          teamId: process.env.APPLE_TEAM_ID,
        },
      },
    },
  });
  // release Windows versions
  await electronBuild({
    arm64: true,
    x64: true,
    win: ['default'],
    config: {
      files,
      // publish: null, // publish or not
    },
  });
};
main();
