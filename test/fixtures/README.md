## Notes on how to create fixtures

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
