# codeclimate-action

[![Build Status](https://github.com/paambaati/codeclimate-action/workflows/PR%20Checks/badge.svg)](https://actions-badge.atrox.dev/paambaati/codeclimate-action/goto) [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Meercode CI Score](https://meercode.io/badge/paambaati/codeclimate-action?type=ci-score&branch=master)](https://meercode.io/paambaati/codeclimate-action)

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

## Usage

This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

### Inputs

| Input               | Default         | Description                                                                        |
| ------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `coverageCommand`   |                 | The actual command that should be executed to run your tests and capture coverage. |
| `workingDirectory`  |                 | Specify a custom working directory where the coverage command should be executed.  |
| `debug`             | `false`         | Enable Code Coverage debug output when set to `true`.                              |
| `coverageLocations` |                 | Locations to find code coverage as a multiline string.<br>Each line should be of the form `<location>:<type>`. See examples below.
| `prefix`            | `undefined`     | See [`--prefix`](https://docs.codeclimate.com/docs/configuring-test-coverage)      |

#### Example

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.7.5
    env:
      CC_TEST_REPORTER_ID: <code_climate_reporter_id>
    with:
      coverageCommand: npm run coverage
      debug: true
```

#### Example with only upload

When you've already generated the coverage report in a previous step and wish to just upload the coverage data to Code Climate, you can leave out the `coverageCommand` option.

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.7.5
    env:
      CC_TEST_REPORTER_ID: <code_climate_reporter_id>
```

#### Example with wildcard (glob) pattern

This action supports basic glob patterns to search for files matching given patterns. It uses [`@actions/glob`](https://github.com/actions/toolkit/tree/master/packages/glob#basic) to expand the glob patterns.

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.7.5
    env:
      CC_TEST_REPORTER_ID: <code_climate_reporter_id>
    with:
      coverageCommand: yarn run coverage
      coverageLocations: |
        ${{github.workspace}}/*.lcov:lcov
```

#### Example with Jacoco

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.7.5
    env:
      # Set CC_TEST_REPORTER_ID as secret of your repo
      CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
      JACOCO_SOURCE_PATH: "${{github.workspace}}/src/main/java"
    with:
      # The report file must be there, otherwise Code Climate won't find it
      coverageCommand: mvn test
      coverageLocations: ${{github.workspace}}/target/site/jacoco/jacoco.xml:jacoco
```

#### Example of multiple test coverages for monorepo with Jest

Let's say you have a monorepo with two folders —`client` and `server`, both with their own coverage folders and a `yarn coverage` script which runs Jest within both folders.

```json
"scripts": {
  "coverage": "yarn client coverage && yarn server coverage"
}
```

First be sure that paths in your `coverage/lcov.info` are correct; they should be either absolute or relative to the **root** of the monorepo. Open `lcov.info` and search for any path. For example —

```lcov
SF:src/server.ts
```

If you find a *relative* path like this (happens for Jest 25+), it's incorrect as it is relative to the sub-package. This can be fixed by configuring Jest to set the root of your monorepo —

```javascript
// server/jest.config.js
module.exports = {
  ...
  coverageReporters: [['lcov', { projectRoot: '..' }]]
  ...
};
```

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.7.5
    env:
      CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
    with:
      coverageCommand: yarn run coverage
      coverageLocations: |
        ${{github.workspace}}/client/coverage/lcov.info:lcov
        ${{github.workspace}}/server/coverage/lcov.info:lcov
```

Example projects

1. [paambaati/websight](https://github.com/paambaati/websight/blob/ae00c393cd6cdf8c4d0fce1195293b761fa689ad/.github/workflows/ci.yml#L33-L49)

2. [MartinNuc/coverage-ga-test](https://github.com/MartinNuc/coverage-ga-test/blob/master/.github/workflows/ci.yaml)
