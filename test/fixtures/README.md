## Notes on how to create fixtures

Currently, this is cumbersome, but it is recommended to check checksums on target platforms as there's minor differences in line endings, and as such, checksums vary for the same file, based on platform.

### Windows

1. To create the SHA256 checksum of a file –

    ```
    certUtil -hashfile test/fixtures/filename.bat SHA256
    ```

### macOS

1. To create the SHA256 checksum of a file –

    ```
    shasum -a 256 test/fixtures/filename.sh
    ```
