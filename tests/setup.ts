import { WebDriver } from 'selenium-webdriver';

// Define the type augmentation using module augmentation instead of namespace
declare global {
  let driver: WebDriver | undefined;
}

// Convert the file to a module
export {};
