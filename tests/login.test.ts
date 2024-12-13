import { WebDriver } from 'selenium-webdriver';
import { login, waitForElement } from './helpers';
import { TestConfig } from './selenium.config';

describe('Lakekeeper Console Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await TestConfig.getDriver();
  });

  afterAll(async () => {
    await TestConfig.quitDriver();
  });

  beforeEach(async () => {
    // Navigate to your application URL before each test
    await driver.get(process.env.APP_URL || 'http://localhost:3001');
  });

  test('should load the application', async () => {
    const title = await driver.getTitle();
    expect(title).toBeTruthy();
  });

  test('should login successfully', async () => {
    await login(driver, 'Peter', 'iceberg');

    // Also verify we're actually logged in by finding the logout buttong
    const el = await waitForElement(
      driver,
      '//*[@id="app"]/div/div/main/div/div/header/div/button',
      'xpath',
    );
    await el.click();
    const logoutEl = await waitForElement(driver, '//*[@id="v-menu-11"]/div/div/div[4]', 'xpath');
    await logoutEl.click();
    await driver.wait(() => driver.getCurrentUrl().then((url) => url.endsWith('/login')), 5000);
    const loginEl2 = await waitForElement(
      driver,
      '//*[@id="app"]/div/div/main/div/div/main/div/div/div[4]/button',
      'xpath',
    );
    // lets make sure we are logged out
    expect(await loginEl2.getText()).toEqual('LOGIN');
  });
});
