# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.1] - 2019-09-19
### Changed
- Upgrade to `@actions/core` v1.1.1 - via [#20](https://github.com/paambaati/codeclimate-action/pull/20).

## [2.2.0] - 2019-08-28
### Fixed
- Inject `GITHUB_` environment vars as CC-specific ones - via [#3](https://github.com/paambaati/codeclimate-action/pull/3). Thanks @b4nst!

## [2.1.0] - 2019-08-16
### Added
- Release script.

### Changed
- ⚡️ Replaced `got` with `node-fetch`. Now the action should run faster!

## [2.0.0] - 2019-08-14
### Changed
- ⚡️ Change from Docker to JavaScript.

## [1.0.0] - 2019-08-09
### Added
- Initial release.
