:: Dummy shell script that exits with a non-zero code when the argument 'after-build' is given.
@echo off
IF "%*" == "after-build --exit-code 0" (
  EXIT /b 69
) ELSE (
  :: `CALL` is a no-op.
  CALL 
)
