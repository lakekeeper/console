import { WebDriver, until, By } from 'selenium-webdriver';

export async function waitForElement(
  driver: WebDriver,
  selector: string,
  selectorType: 'css' | 'xpath' = 'css',
  click: boolean = false,
  viz: boolean = true,
  timeout = 5000,
) {
  const by = selectorType === 'css' ? By.css(selector) : By.xpath(selector);
  const element = await driver.wait(until.elementLocated(by), timeout);
  if (click) {
    await element.click();
  }
  if (viz) {
    await driver.wait(until.elementIsVisible(element), timeout, 'Element not visible');
  }
  await driver.wait(until.elementIsEnabled(element), timeout, 'Element not enabled');
  return element;
}

export async function login(driver: WebDriver, username: string, password: string) {
  const loginEl = await waitForElement(
    driver,
    '//button[contains(@class, "v-btn") and .//span[contains(@class, "v-btn__content") and text()="Login"]]',
    'xpath',
  );

  expect(await loginEl.getText()).toEqual('LOGIN');
  await loginEl.click();
  await waitForElement(driver, '#username');

  await driver.findElement(By.id('username')).sendKeys(username);
  await driver.findElement(By.id('password')).sendKeys(password);

  await driver.findElement(By.css('button[type="submit"]')).click();

  // Wait for successful login
  await driver.wait(until.urlMatches(RegExp('/ui/?$')), 5000);
}

export async function goToSidebar(driver: WebDriver, sidebarItem: string) {
  const el = await waitForElement(
    driver,
    '//*[@id="app"]/div/div/main/div/div/header/div/div[1]/button',
    'xpath',
  );
  // check if the sidebar is open by iterating over its elements and checking if any has class = mdi-menu-open
  (await el.findElements(By.xpath('*'))).map(async (element) => {
    if ((await element.getAttribute('class'))?.includes('mdi-menu-open')) {
      return;
    }
    await el.click();
  });

  const sidebarEl = await waitForElement(driver, `//*[text()="${sidebarItem}"]`, 'xpath');
  await sidebarEl.click();
}

// Using a discriminated union
type AWSConfig = {
  type: 'aws';
  bucket: string;
  region: string;
  accessKey: string;
  secretKey: string;
  prefix: string;
  endpoint?: string;
  sts_role?: string;
};

type MinioConfig = {
  type: 'minio';
  bucket: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  prefix: string;
  sts: boolean;
};

export async function createWarehouse(
  driver: WebDriver,
  name: string,
  type: AWSConfig | MinioConfig,
) {
  await goToSidebar(driver, 'Warehouses');
  await driver.wait(
    () => driver.getCurrentUrl().then((url) => url.endsWith('/ui/warehouse')),
    5000,
  );

  const createButton = await waitForElement(
    driver,
    '//button[contains(@class, "v-btn")]//span[@class="v-btn__content" and text()="Add Warehouse"]',
    'xpath',
  );

  await createButton.click();
  await driver.sleep(500);
  //
  // const nameInput = await waitForElement(
  //   driver,
  //   '.v-field__input[placeholder="my-warehouse"]',
  //   'css'
  // );
  // console.log('nameInput', nameInput);
  // await nameInput.sendKeys(name);

  // Wait for the input field to be present
  const nameInput = await waitForElement(driver, 'input[placeholder="my-warehouse"]', 'css', true);

  await nameInput.clear();
  await nameInput.sendKeys(name);

  if (type.type === 'minio' || type.type === 'aws') {
    await driver.findElement(By.css('input[value="S3"][type="radio"]')).click();
    await waitForElement(
      driver,
      '//div[contains(@class, "v-field__field")]//label[text()="AWS Access Key ID"]/following-sibling::input[contains(@class, "v-field__input")]',
      'xpath',
      true,
    ).then((el) => el.sendKeys(type.accessKey));
    await waitForElement(
      driver,
      '//div[contains(@class, "v-field__field")]//label[text()="AWS Secret Access Key"]/following-sibling::input[contains(@class, "v-field__input")]',
      'xpath',
      true,
    ).then((el) => el.sendKeys(type.secretKey));
    await waitForElement(
      driver,
      '//div[contains(@class, "v-field__field")]//label[text()="Bucket"]/following-sibling::input[contains(@class, "v-field__input")]',
      'xpath',
      true,
    ).then((el) => el.sendKeys(type.bucket));

    if (type.endpoint) {
      await waitForElement(
        driver,
        '//label[text()="Endpoint"]/following-sibling::input[contains(@class, "v-field__input")]',
        'xpath',
        true,
      ).then((el) => el.sendKeys(type.endpoint ?? ''));
    }

    await waitForElement(
      driver,
      '//label[text()="Key Prefix"]/following-sibling::input[contains(@class, "v-field__input")]',
      'xpath',
      true,
    ).then((el) => el.sendKeys(type.prefix ?? ''));

    if (type.type === 'minio') {
      await driver.executeScript(`
    // Try multiple selector approaches to find the input
    const input = (
        document.querySelector('.v-field__input input[type="text"][inputmode="none"]') ||
        document.querySelector('input[aria-label="Open"][title="Open"]') ||
        document.querySelector('.v-field__field div[data-no-activator] input')
    );

    if (input) {
        // Force focus first
        input.focus();
        // Trigger multiple events to ensure the dropdown opens
        ['mousedown', 'mouseup', 'click'].forEach(eventType => {
            const event = new MouseEvent(eventType, {
                view: window,
                bubbles: true,
                cancelable: true
            });
            input.dispatchEvent(event);
        });
    } else {
        console.log('Input element not found');
    }
`);

      const menuOption = await driver.wait(
        until.elementLocated(By.xpath('//div[contains(@class, "v-list-item")]//div[contains(text(), "S3 Compatible")]')),
        5000
      );
    console.log("menupt");
      await menuOption.click();

      const el = await waitForElement(
        driver,
        '//label[text()="Bucket Region"]/following-sibling::div[contains(@class, "v-field__input")]',
        'xpath',
        true,
      );

    // Force the field into focus and editable state using JavaScript
          await driver.executeScript(`
        arguments[0].focus();
        arguments[0].click();
        arguments[0].value = '';
        arguments[0].dispatchEvent(new Event('input'));
        arguments[0].dispatchEvent(new Event('change'));
    `, el);
      await driver.actions()
        .move({origin: el})
        .click()
        .pause(500)
        .sendKeys('deu-central-1')
        .perform();
      // Wait for the dropdown menu to be visible
    }
  }
  await driver.sleep(10000);
  await driver.findElement(By.css('button[type="submit"]')).click();

  await driver.wait(
    () => driver.getCurrentUrl().then((url) => url.endsWith('/ui/warehouse')),
    5000,
  );
}
