import { test, expect } from '@playwright/test';

import preload from './preload';

const $ = preload();

test('0', async () => {
  await $.page.waitForTimeout(10000);
  expect(await $.page.title()).toEqual('Assets Hosting');
  await $.page.waitForTimeout(10000);
});
