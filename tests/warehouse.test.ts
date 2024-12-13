import { randomUUID } from 'node:crypto';
import { WebDriver } from 'selenium-webdriver';
import { createWarehouse, goToSidebar, login } from './helpers';
import { TestConfig } from './selenium.config';

describe('Lakekeeper Console Tests', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await TestConfig.getDriver();
    await driver.get(process.env.APP_URL || 'http://localhost:3001');
    await login(driver, 'Peter', 'iceberg');
  });

  beforeEach(async () => {
    // Navigate to your application URL before each test
    await driver.get(process.env.APP_URL || 'http://localhost:3001');
    if (!driver.getCurrentUrl().then((url) => url.endsWith('/ui/warehouse$'))) {
      await goToSidebar(driver, 'Warehouses');
      await driver.wait(
        () => driver.getCurrentUrl().then((url) => url.endsWith('/ui/warehouse')),
        5000,
      );
    };
  });

  afterAll(async () => {
    await TestConfig.quitDriver();
  });

  test('is at Warehouses', async () => {
    expect(await driver.getCurrentUrl()).toMatch(RegExp('.*/ui/warehouse'));
  });

  test('create', async () => {
    await createWarehouse(driver, 'test-warehouse' + randomUUID(), {
      type: 'minio',
      accessKey: 'minio-root-user',
      secretKey: 'minio-root-password',
      endpoint: 'http://minio:9000',
      bucket: 'examples',
      prefix: 'test',
      sts: false,
    });
  });
});
