# codeclimate-action

[![Build Status](https://github.com/paambaati/codeclimate-action/workflows/PR%20Checks/badge.svg)](https://actions-badge.atrox.dev/paambaati/codeclimate-action/goto) [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

## Usage

This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

### Inputs

| Input               | Default         | Description                                                                        |
| ------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `coverageCommand`   | `yarn coverage` | The actual command that should be executed to run your tests and capture coverage. |
| `debug`             | `false`         | Enable Code Coverage debug output when set to `true`.                              |
| `coverageLocations` |                 | Locations to find code coverage (Used for builds from multiple locations). Multiline string.<br>Format is `location:type`, e.g. `./coverage/lcov.info:lcov`)|
| `prefix`            | `undefined`     | See [`--prefix`](https://docs.codeclimate.com/docs/configuring-test-coverage)      |

#### Example

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.5.7
    env:
      CC_TEST_REPORTER_ID: <code_climate_reporter_id>
    with:
      coverageCommand: npm run coverage
      debug: true
```

#### Example with Jacoco

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.5.7
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

Let's say you have a monorepo with two folders `client` and `server` both with separated coverage folders and `yarn coverage` script which runs jest within both folders.

```json
"scripts": {
  "coverage": "yarn client coverage && yarn server coverage"
}
```

First be sure that paths in your `coverage/lcov.info` are correct. Means they should be either absolute or relative *to the root of the monorepo*. Open `lcov.info` and search for any path. For example:

```lcov
SF:src/server.ts
```

If you find a *relative* path like this (happens for Jest 25+) it's not correct. The path must be relative to the monorepo root. Means it should be `server/src/server.ts`. For Jest you can set the root of your repo like this:

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
    uses: paambaati/codeclimate-action@v2.5.7
    env:
      CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
    with:
      # coverageCommand: yarn coverage - this line is actually not needed because `yarn coverage` is by default
      coverageLocations: |
        ${{github.workspace}}/client/coverage/lcov.info:lcov
        ${{github.workspace}}/server/coverage/lcov.info:lcov
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/ae00c393cd6cdf8c4d0fce1195293b761fa689ad/.github/workflows/ci.yml#L33-L49)
