const base = require("../../jest.config");
module.exports = {
  ...base,
  testRegex: "(\\.|/)(spec|e2e-spec)\\.ts$",
};
