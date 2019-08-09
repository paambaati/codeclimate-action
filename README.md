# codeclimate-action

A GitHub action that sends your code coverage to [Code Climate](http://codeclimate.com/).

# Usage
This action requires that you set [`CC_TEST_REPORTER_ID`](https://docs.codeclimate.com/docs/configuring-test-coverage). You can find it under Repo Settings in your Code Climate project.

# Example

<img align="right" height="350" src="/action.png?raw=true">

```
action "send coverage to code climate" {
  uses = "paambaati/codeclimate-action@v1.0.0"
  secrets = ["CC_TEST_REPORTER_ID"]
}
```
