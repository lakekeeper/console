/**
 * Queue configuration interface and default queue options
 */

import { QueueOption } from './interfaces';
import { DEFAULT_QUEUE_OPTIONS } from './queueOptions';

// Re-export for convenience
export type { QueueOption };

/**
 * Queue configuration class that manages queue options
 */
export class QueueConfigManager {
  private _options: QueueOption[];

  constructor(initialOptions: QueueOption[] = DEFAULT_QUEUE_OPTIONS) {
    this._options = [...initialOptions];
  }

  get options(): QueueOption[] {
    return [...this._options];
  }

  getByValue(value: string): QueueOption | undefined {
    return this._options.find((option) => option.value === value);
  }

  addOption(option: QueueOption): void {
    // Check if option with same value already exists
    const existingIndex = this._options.findIndex((opt) => opt.value === option.value);
    if (existingIndex >= 0) {
      // Update existing option
      this._options[existingIndex] = option;
    } else {
      // Add new option
      this._options.push(option);
    }
  }

  /**
   * Format a queue name for display
   * If the queue name matches a known option, return the title
   * Otherwise, return the original name formatted nicely
   */
  formatQueueName(queueName: string): string {
    if (!queueName) return '';

    const option = this.getByValue(queueName);
    if (option) {
      return option.title;
    }

    // Fallback formatting: convert snake_case to Title Case
    return queueName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

/**
 * Default queue configuration instance
 */
export const queueConfig = new QueueConfigManager();

/**
 * Hook for extending queue options in specific contexts
 */
export function useQueueConfig(additionalOptions?: QueueOption[]): QueueConfigManager {
  const config = new QueueConfigManager(DEFAULT_QUEUE_OPTIONS);

  if (additionalOptions) {
    additionalOptions.forEach((option) => config.addOption(option));
  }

  return config;
}
