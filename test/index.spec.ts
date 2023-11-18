import { test, expect } from '@playwright/test';

import preload from './preload';

const $ = preload();

test('0', async () => {
  expect(await $.page.title()).toEqual('Assets Hosting');
});

test('1', async () => {
  expect(await $.page.title()).toEqual('Assets Hosting');
  await $.page.click('text=Login via GitHub');
  await $.page.waitForTimeout(3000);
});

test('2', async () => {
  expect(await $.page.title()).toEqual('Assets Hosting');
  await $.page.click('text=Login via GitHub');
  await $.page.waitForTimeout(3000);
  await $.page.click('text=tyler4longdemo/demo');
  await $.page.waitForTimeout(3000);
});
