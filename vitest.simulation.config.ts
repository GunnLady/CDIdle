import { defineConfig, mergeConfig } from 'vitest/config';
import config from './vitest.config';
import { SIMULATION_TEST_FILES } from './scripts/simulation-tests';

const simulationConfig = mergeConfig(config, defineConfig({
  test: {
    maxWorkers: 2,
    testTimeout: 60_000,
    coverage: { enabled: false },
  },
}));
// Replace arrays: mergeConfig concatenates them by default.
simulationConfig.test!.include = [...SIMULATION_TEST_FILES];
simulationConfig.test!.exclude = [];

export default simulationConfig;
