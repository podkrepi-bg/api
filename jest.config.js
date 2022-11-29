const { getJestProjects } = require('@nrwl/jest')

module.exports = {
  projects: getJestProjects(),
  reporters: ['default', 'jest-junit'],
}
