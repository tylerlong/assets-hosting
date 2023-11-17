import path from 'path';
import type { ElectronApplication, Page, TestInfo } from '@playwright/test';
import { test, _electron } from '@playwright/test';
import { Blue, Red } from 'color-loggers';
import slugify from 'slugify';

const blue = new Blue('[Log]:');
const red = new Red('[Error]:');
const stdoutHandler = (chunk: any) => blue.log(chunk.toString());
const stderrHandler = (chunk: any) => red.log(chunk.toString());

class Preload {
  public app: ElectronApplication;
  public page: Page;
  public recordVideo: boolean;

  public constructor(recordVideo = false) {
    this.recordVideo = recordVideo;
  }

  public async setup() {
    this.app = await _electron.launch({
      args: ['build/electron.js'],
      recordVideo: this.recordVideo
        ? {
            dir: path.join(__dirname, 'videos'),
            size: {
              width: 1920,
              height: 1080,
            },
          }
        : undefined,
    });
    this.app.process().stdout!.addListener('data', stdoutHandler);
    this.app.process().stderr!.addListener('data', stderrHandler);
    this.page = await this.app.firstWindow();
    if (this.recordVideo) {
      this.page.setViewportSize({
        width: 1920,
        height: 1080,
      });
    }
    await this.page.waitForLoadState('load');
  }

  public async teardown(testInfo: TestInfo) {
    // take a screenshot before teardown
    await this.screenshot(slugify(testInfo.title, { strict: true, lower: true }));
    await this.app.evaluate(async ({ dialog, app }) => {
      dialog.showMessageBox = () => Promise.resolve({ response: 1, checkboxChecked: false });
      app.quit();
    });
    this.app.process().stdout!.removeListener('data', stdoutHandler);
    this.app.process().stderr!.removeListener('data', stderrHandler);
    await this.app.close();
  }

  public async screenshot(name: string) {
    if (this.page.isClosed()) {
      return;
    }
    await this.page.screenshot({ path: `test/screenshots/${name}.png`, animations: 'disabled' });
  }
}

const preload = (recordVideo = false) => {
  const $ = new Preload(recordVideo);
  test.beforeEach(async () => {
    await $.setup();
  });
  // eslint-disable-next-line no-empty-pattern
  test.afterEach(async ({}, testInfo) => {
    await $.teardown(testInfo);
  });
  return $;
};

export default preload;
