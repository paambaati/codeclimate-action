# codeclimate-action

[![Build Status](https://github.com/paambaati/codeclimate-action/workflows/PR%20Checks/badge.svg)](https://actions-badge.atrox.dev/paambaati/codeclimate-action/goto) [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

## Usage
This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

### Inputs

| Input             | Default         | Description                                                                        |
|-------------------|-----------------|------------------------------------------------------------------------------------|
| `coverageCommand` | `yarn coverage` | The actual command that should be executed to run your tests and capture coverage. |
| `debug`           | `false`         | Enable Code Coverage debug output when set to `true`.                              |

#### Example

```yaml
steps:
- name: Test & publish code coverage
  uses: paambaati/codeclimate-action@v2.3.0
  env:
    CC_TEST_REPORTER_ID: <code_climate_reporter_id>
  with:
    coverageCommand: npm run coverage
    debug: true
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/663bd4245b3c2dbd768aff9bfc197103ee77973e/.github/workflows/ci.yml#L33-L49)
