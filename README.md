# codeclimate-action

A GitHub action that publishes your code coverage to [Code Climate](http://codeclimate.com/).

# Usage
This action requires that you set the [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

The default coverage command is `yarn coverage`. You can change it by setting the `args` value.

# Example

#### HCL syntax
```hcl
action "Test & publish code coverage" {
  uses = "paambaati/codeclimate-action@master"
  env = {
    CC_TEST_REPORTER_ID = "<code_climate_reporter_id>"
  }
  args = "npm run coverage"
}
```
#### YAML syntax
```yaml
steps:
- name: Test & publish code coverage
  uses: paambaati/codeclimate-action@master
  env:
    CC_TEST_REPORTER_ID: <code_climate_reporter_id>
  with:
    coverageCommand: npm run coverage
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/master/.github/)
