/**
 * Default queue options available in the system
 */

import { QueueOption } from './interfaces';

export const DEFAULT_QUEUE_OPTIONS: QueueOption[] = [
  {
    title: 'Tabular Expiration',
    value: 'tabular_expiration',
  },
  {
    title: 'Tabular Purge',
    value: 'tabular_purge',
  },
];
