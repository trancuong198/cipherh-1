import { IGene } from './IGene';
import { logger } from '../services/logger';

// Core symbiosis genes that enable the system to function
export const allGenes: IGene[] = [
  {
    name: 'core-survival',
    description: 'Core survival monitoring gene',
    immutable: true,
    init: async () => {
      logger.info('[gene:core-survival] initialized');
    },
  },
];
