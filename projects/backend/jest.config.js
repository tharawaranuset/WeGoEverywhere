// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'jsdom',
  
  // ⭐ เพิ่มส่วนนี้ - สำคัญมาก!
  moduleNameMapper: {
    '^@backend/src/(.*)$': '<rootDir>/src/$1',
    '^@backend/(.*)$': '<rootDir>/$1',
  },

  // Optional: ช่วยให้ Jest หา modules ได้ง่ายขึ้น
  modulePaths: ['<rootDir>'],
  
  // ถ้ามี tsconfig paths อื่นๆ ให้เพิ่มที่นี่
  // เช่น:
  // '^@shared/(.*)$': '<rootDir>/src/shared/$1',
  // '^@modules/(.*)$': '<rootDir>/src/modules/$1',
};