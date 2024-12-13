import { WebDriver, Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

export class TestConfig {
  private static driver: WebDriver;

  static async getDriver(): Promise<WebDriver> {
    if (!this.driver) {
      const builder = new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options());

      if (process.env.SELENIUM_REMOTE_URL) {
        builder.usingServer(process.env.SELENIUM_REMOTE_URL);
      }

      this.driver = await builder.build();
    }
    return this.driver;
  }

  static async quitDriver(): Promise<void> {
    if (this.driver) {
      await this.driver.quit();
    }
  }
}
