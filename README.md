# codeclimate-action

A GitHub action that sends your code coverage to [Code Climate](http://codeclimate.com/).

ℹ️ For now, it only supports Node.js projects.

# Usage
This action requires that you set [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage) environment variable. You can find it under Repo Settings in your Code Climate project.

The default coverage command is `yarn coverage`. You can change it by setting the `args` value.

# Example

<img height="891" src="action.png?raw=true">

#### HCL syntax
```hcl
action "Publish code coverage" {
  uses = "paambaati/codeclimate-action@master"
  env = {
    CC_TEST_REPORTER_ID = "<code_climate_reporter_id>"
  }
  args = "yarn coverage"
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
    args: yarn coverage
```

Example project — [paambaati/websight](https://github.com/paambaati/websight/blob/master/.github/)
