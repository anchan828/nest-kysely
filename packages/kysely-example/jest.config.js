const base = require("../../jest.config");
module.exports = {
  ...base,
  testRegex: "(\\.|/)(spec|e2e-spec)\\.ts$",
  coveragePathIgnorePatterns: ["/node_modules/", "/test-utils/"]
};
