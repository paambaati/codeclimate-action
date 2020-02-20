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
| `coverageLocations` | `[]`            | Locations to find code coverage (Used for builds from multiple locations)          |
|                     |                 | Format is (location:type, e.g. ./coverage/lcov.info:lcov)                          |

#### Example

```yaml
steps:
  - name: Test & publish code coverage
    uses: paambaati/codeclimate-action@v2.4.0
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
    uses: paambaati/codeclimate-action@v2.4.0
    env:
      # Set CC_TEST_REPORTER_ID as secret of your repo
      CC_TEST_REPORTER_ID: ${{secrets.CC_TEST_REPORTER_ID}}
      JACOCO_SOURCE_PATH: "${{github.workspace}}/src/main/java"
    with:
      # The report file must be there, otherwise Code Climate won't find it
      coverageCommand: mvn test
      coverageLocations:
        "${{github.workspace}}/target/site/jacoco/jacoco.xml:jacoco"
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/663bd4245b3c2dbd768aff9bfc197103ee77973e/.github/workflows/ci.yml#L33-L49)
