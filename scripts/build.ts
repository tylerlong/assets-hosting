import { run } from 'shell-commands';

const build = async () => {
  await run(`
  rm -rf .parcel-cache
  rm -rf build
  yarn parcel build --target electron --no-source-maps
  yarn parcel build --target web --no-source-maps
  yarn parcel build --target preload --no-source-maps
  yarn parcel build --target settings --no-source-maps
`);
};

export default build;
