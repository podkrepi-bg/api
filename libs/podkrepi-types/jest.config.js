module.exports = {
  displayName: 'podkrepi-types',
  preset: '../../jest.preset.js',
  globals: {
    'ts-jest': {
      isolatedModules: true,
      tsconfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/libs/podkrepi-types',
}
