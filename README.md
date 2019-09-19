# codeclimate-action

[![Build Status](https://github.com/paambaati/codeclimate-action/workflows/PR%20Checks/badge.svg)](https://actions-badge.atrox.dev/paambaati/codeclimate-action/goto) [![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

## Usage
This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

The default coverage command is `yarn coverage`. You can change it by setting the `coverageCommand` input value.

### Example

```yaml
steps:
- name: Test & publish code coverage
  uses: paambaati/codeclimate-action@v2.2.1
  env:
    CC_TEST_REPORTER_ID: <code_climate_reporter_id>
  with:
    coverageCommand: npm run coverage
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/3275cf0451e4c4651190eecdbfa424dbacfdfbe7/.github/workflows/ci.yml#L33-L49)
