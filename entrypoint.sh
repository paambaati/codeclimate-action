#!/bin/bash

# Exit if any subcommand fails
set -eu

export CC_TEST_REPORTER_ID=${INPUT_CC_TEST_REPORTER_ID}
curl -L https://codeclimate.com/downloads/test-reporter/test-reporter-latest-linux-amd64 > ./cc-test-reporter
chmod +x ./cc-test-reporter
./cc-test-reporter before-build

bash -c "$1"

./cc-test-reporter after-build --exit-code
