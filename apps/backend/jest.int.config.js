const esmOnlyPackages = [
  'better-auth',
  '@better-auth',
  'better-call',
  '@noble',
  'rou3',
  'jose',
  'kysely',
];

/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'mjs', 'json', 'ts', 'tsx'],
  rootDir: './',
  testRegex: '\\.int-spec\\.ts$',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
    '^.+\\.m?js$': [
      'ts-jest',
      {
        isolatedModules: true,
        tsconfig: { allowJs: true, module: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: [
    `/node_modules/(?!(\\.pnpm/)?(${esmOnlyPackages.join('|')}))`,
  ],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/core/email/render$':
      '<rootDir>/src/test/integration/render-email.stub.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  globalSetup: '<rootDir>/src/test/integration/global-setup.ts',
  setupFiles: ['<rootDir>/src/test/integration/setup-env.ts'],
  maxWorkers: 1,
};
