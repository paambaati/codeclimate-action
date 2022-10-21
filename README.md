# codeclimate-action

[![Test Coverage](https://api.codeclimate.com/v1/badges/8f2233d4c51c92ad427c/test_coverage)](https://codeclimate.com/github/paambaati/codeclimate-action/test_coverage)
[![Build Status](https://github.com/paambaati/codeclimate-action/workflows/PR%20Checks/badge.svg)](https://actions-badge.atrox.dev/paambaati/codeclimate-action/goto)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

> **Warning**
>
> Please upgrade to v3.1.1 (or higher) immediately. v3.1.0 was recently broken inadverdently, and the only fix is to upgrade your action to v3.1.1 or higher. Please see [#626](https://github.com/paambaati/codeclimate-action/issues/626) for more details.


## Usage

This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

### Inputs

| Input               | Default         | Description                                                                        |
| ------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `coverageCommand`   |                 | The actual command that should be executed to run your tests and capture coverage. |
| `workingDirectory`  |                 | Specify a custom working directory where the coverage command should be executed.  |
| `debug`             | `false`         | Enable Code Coverage debug output when set to `true`.                              |
| `coverageLocations` |                 | Locations to find code coverage as a multiline string.<br>Each line should be of the form `<location>:<type>`.<br>`type` can be any one of `clover, cobertura, coverage.py, excoveralls, gcov, gocov, jacoco, lcov, lcov-json, simplecov, xccov`. See examples below. |
| `prefix`            | `undefined`     | See [`--prefix`](https://docs.codeclimate.com/docs/configuring-test-coverage)      |
| `verifyDownload`    | `true`          | Verifies the downloaded Code Climate reporter binary's checksum and GPG signature. See [Verifying binaries](https://github.com/codeclimate/test-reporter#verifying-binaries)      |

#### Example

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v3.2.0
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
    uses: paambaati/codeclimate-action@v3.2.0
    env:
      CC_TEST_REPORTER_ID: <code_climate_reporter_id>
```

#### Example with wildcard (glob) pattern

This action supports basic glob patterns to search for files matching given patterns. It uses [`@actions/glob`](https://github.com/actions/toolkit/tree/master/packages/glob#basic) to expand the glob patterns.

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v3.2.0
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
    uses: paambaati/codeclimate-action@v3.2.0
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
    uses: paambaati/codeclimate-action@v3.2.0
    env:
      CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
    with:
      coverageCommand: yarn run coverage
      coverageLocations: |
        ${{github.workspace}}/client/coverage/lcov.info:lcov
        ${{github.workspace}}/server/coverage/lcov.info:lcov
```

Example projects

1. [paambaati/websight](https://github.com/paambaati/websight/blob/89f03007680531587dd5ff5c673e6d813a298d8c/.github/workflows/ci.yml#L33-L50)

2. [MartinNuc/coverage-ga-test](https://github.com/MartinNuc/coverage-ga-test/blob/master/.github/workflows/ci.yaml)
