#!/bin/bash
# Dummy shell script that exist with a non-zero code when the argument 'after-build' is given.
if [[ "$*" == "after-build --exit-code 0" ]]
  then exit 69
else
  :
fi
