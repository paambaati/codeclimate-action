# [3.2.0](https://github.com/paambaati/codeclimate-action/compare/v3.1.0...v3.2.0) (2022-10-21)


### Bug Fixes

* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))


### Features

* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)

## [3.1.1](https://github.com/paambaati/codeclimate-action/compare/v3.1.0...v3.1.1) (2022-10-20)


### Bug Fixes

* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))

# [3.1.0] - 2022-10-14
### Changed
- Updated base runtime version to Node.js 16.x - via [`#622`](https://github.com/paambaati/codeclimate-action/pull/622). This closes [`#621`](https://github.com/paambaati/codeclimate-action/issues/621). Thanks @fabn!

# [3.0.0] - 2021-09-30
### Added
- ✨ Verifies CC reporter binary after download - via [`#429`](https://github.com/paambaati/codeclimate-action/pull/429). This closes [`#331`](https://github.com/paambaati/codeclimate-action/issues/331).

### Fixed
- 🐛 Escape `action.yml` correctly so v3.x can be published - via [`#432`](https://github.com/paambaati/codeclimate-action/pull/432). This closes [`#430`](https://github.com/paambaati/codeclimate-action/issues/430). Thanks @antongolub!

# [2.7.5] - 2020-12-10
### Added
- ✨ Coverage prefix will now work for `after-build` commands as well - via [`#266`](https://github.com/paambaati/codeclimate-action/pull/266). This closes [`#265`](https://github.com/paambaati/codeclimate-action/issues/265). Thanks @matthewshirley!

# [2.7.4] - 2020-10-03
### Added
- 💫 Coverage locations can now be Glob patterns - via [`#240`](https://github.com/paambaati/codeclimate-action/pull/240). This closes [`#234`](https://github.com/paambaati/codeclimate-action/issues/234). Thanks @Sumolari!

# [2.7.3] - 2020-10-01
### Fixed
- 🐛 Default coverage command now correctly defaults to `''` - via [`#238`](https://github.com/paambaati/codeclimate-action/pull/238). This closes [`#235`](https://github.com/paambaati/codeclimate-action/issues/235). Thanks @bennypowers!

# [2.7.2] - 2020-10-01
### Fixed
- 🐛 The entrypoint logic was fixed so the script will _actually_ run now - via [`#236`](https://github.com/paambaati/codeclimate-action/pull/236). This closes [`#235`](https://github.com/paambaati/codeclimate-action/issues/235).

# [2.7.1] - 2020-09-22
### Added
- `coverageCommand` argument is now optional - via [`#220`](https://github.com/paambaati/codeclimate-action/pull/220). This closes [`#182`](https://github.com/paambaati/codeclimate-action/issues/182).

# [2.7.0] - 2020-09-22
### Added
- Customizable working directory with the new `workingDirectory` option - via [`#220`](https://github.com/paambaati/codeclimate-action/pull/220). Thanks @arareko!

### Fixed
- Errors in the `before-build` and `after-build` steps, if any, are now surfaced correctly - via [`#214`](https://github.com/paambaati/codeclimate-action/pull/214). Thanks @olly!

### Changed
- Dependencies upgraded to latest, including tape v5.

# [2.6.0] - 2020-04-24
### Fixed
- Fixed regressions introduced in [`#154`](https://github.com/paambaati/codeclimate-action/pull/154). Thanks @MartinNuc!

# [2.5.7] - 2020-04-17
### Fixed
- Finally fixed the long-standing [`#119`](https://github.com/paambaati/codeclimate-action/issues/119) with proper exit code handling - via [`#154`](https://github.com/paambaati/codeclimate-action/pull/154).

# [2.5.6] - 2020-03-28
### Fixed
- Correctly report `HEAD` SHA for PRs (and some nice refactors) - via [`#141`](https://github.com/paambaati/codeclimate-action/pull/141). Thanks @vladjerca!

# [2.5.5] - 2020-03-18
### Fixed
- `--prefix` fixes - via [`#131`](https://github.com/paambaati/codeclimate-action/pull/131). Thanks @rwjblue!

# [2.5.4] - 2020-03-04
### Fixed
- Fixes [#119](https://github.com/paambaati/codeclimate-action/issues/119) - via [`#127`](https://github.com/paambaati/codeclimate-action/pull/127).

# [2.5.3] - 2020-02-26
### Fixed
- Fixes [#109](https://github.com/paambaati/codeclimate-action/issues/109) and #117(https://github.com/paambaati/codeclimate-action/issues/117) - via [`#118`](https://github.com/paambaati/codeclimate-action/pull/118).

# [2.5.2] - 2020-02-26
### Changed
- [Better error message on failure of downloading CC Reporter](https://github.com/paambaati/codeclimate-action/issues/98) - via [`#116`](https://github.com/paambaati/codeclimate-action/pull/116).

# [2.5.1] - 2020-02-26
### Fixed
- Fix reporting the [wrong branch name for PRs](https://github.com/paambaati/codeclimate-action/issues/86) - via [`#115`](https://github.com/paambaati/codeclimate-action/pull/115).

# [2.5.0] - 2020-02-25
### Added
- Custom `--prefix` support - via [`#111`](https://github.com/paambaati/codeclimate-action/pull/111).

# [2.4.0] - 2020-01-07
### Added
- Multiple coverage locations support - via [`#77`](https://github.com/paambaati/codeclimate-action/pull/77). Thanks @mattvv!

# [2.3.0] - 2019-10-31
### Added
- Debug support - via [`#45`](https://github.com/paambaati/codeclimate-action/pull/45).

# [2.2.6] - 2019-10-31
### Fixed
- `env` issues introduced after the Husky-related fixes.

# [2.2.5] - 2019-10-29
### Fixed
- Remove `husky` as a dependency.

### Changed
- Automated releases thanks to [`technote-space/release-github-actions`](https://github.com/technote-space/release-github-actions).

# [2.2.4] - 2019-10-27
### Fixed
- Fix [missing files](https://github.com/paambaati/codeclimate-action/issues/42#issuecomment-546676537).

# [2.2.3] - 2019-10-27
### Fixed
- Fix [runtime failures](https://github.com/paambaati/codeclimate-action/issues/42#issuecomment-546659123) - via [`0a0ba88`](https://github.com/paambaati/codeclimate-action/commit/0a0ba88ef1092c69d5be6235dc6d493a699ffb1a) and [`c2422ad`](https://github.com/paambaati/codeclimate-action/commit/c2422ad00a34ed3524226d5d1e2124e05a970874).

# [2.2.2] - 2019-10-27
### Fixed
- Code coverage will also be available in 'Overview' tab - via [#43](https://github.com/paambaati/codeclimate-action/pull/43).

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
