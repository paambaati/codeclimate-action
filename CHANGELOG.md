# Changelog

## [8.0.0](https://github.com/paambaati/codeclimate-action/compare/v8.0.0...v8.0.0) (2024-06-12)


### ⚠ BREAKING CHANGES

* declare new environment verification option in action.yml
* new environment verification flag
* new environment verification flag
* migrate everything to ESM-only
* upgrade module to ESM
* **ci:** this doesn't change the functionality of the core action, but it does change how releases are made in the future.
* Trying to make semantic-release push a new release
* this should ideally get published as v5
* this should ideally get published as v5
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter – see codeclimate.com/changelog/7dd79ee1cf1af7141b2bd18b
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter
* **ci:** semantic-release and its process is fundamentally broken when the repo moved from master to main for its main branch. This is an attempt to try to unfuck the git log/ref notes

### core

* Support Windows ([9af890c](https://github.com/paambaati/codeclimate-action/commit/9af890ca201808293494389e160c2247062e61ab))
* Support Windows ([3434c61](https://github.com/paambaati/codeclimate-action/commit/3434c618e21bb9a4ea49f8f85e10839bef1addcd))


### Features

* **ci:** replace semantic-release with Google's release-please. ([854ea46](https://github.com/paambaati/codeclimate-action/commit/854ea46b10d7c48dc04f57be960f2257fca0ba16))
* **core/internal:** migrate to Japa as test runner. ([c909795](https://github.com/paambaati/codeclimate-action/commit/c909795d1dcb5df36fdeeff279bb457ba354f9f7))
* **core:** cleanup downloaded artifacts ([f331896](https://github.com/paambaati/codeclimate-action/commit/f3318964532e9a7bdf28c20830035973024c31bc)), closes [#639](https://github.com/paambaati/codeclimate-action/issues/639)
* **core:** migrate everything to ESM-only ([6e2b10b](https://github.com/paambaati/codeclimate-action/commit/6e2b10b46edc4c533e010d5f6df2d446de6beccf))
* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)
* **core:** Support Windows ([f0efca8](https://github.com/paambaati/codeclimate-action/commit/f0efca8d8bb2d28d2e31f5b09b3a12db580b74ed))
* **core:** Support Windows ([9787ba6](https://github.com/paambaati/codeclimate-action/commit/9787ba65355cc7e2454726ff732df574e1a6b370))
* migrate everything to ESM-only ([fed36ec](https://github.com/paambaati/codeclimate-action/commit/fed36ec1bc2a2dece8a108b769afb805aeaca1e1))
* new environment verification flag ([fa81470](https://github.com/paambaati/codeclimate-action/commit/fa81470c1bd63538aaec8ea3f8a0bb4a20964f1d))
* new environment verification flag ([6007e34](https://github.com/paambaati/codeclimate-action/commit/6007e345cd3be63fd59b5d55fd0f16edfb308ce1))
* run action using Node.js 20.x ([859e71d](https://github.com/paambaati/codeclimate-action/commit/859e71d20050925c52fd9524f5c74a0a36fba31f))
* run action using Node.js 20.x ([096c232](https://github.com/paambaati/codeclimate-action/commit/096c232e4cf323b72675683a27680ac60eead7e8))
* run action using Node.js 20.x ([7642145](https://github.com/paambaati/codeclimate-action/commit/7642145673e571d8436a9743a36d090a6f6acc5d))
* run action using Node.js 20.x ([f01d194](https://github.com/paambaati/codeclimate-action/commit/f01d1944ff5c4726c7649bf3698c1149996369bd))
* run action using Node.js 20.x ([a5d0e4f](https://github.com/paambaati/codeclimate-action/commit/a5d0e4fed50e0ae7f30c14a173467bf5651a1e8c))
* run action using Node.js 20.x ([052f893](https://github.com/paambaati/codeclimate-action/commit/052f89397e39d4b69b7f4981f7428cc626a5807c))
* upgrade module to ESM ([797e381](https://github.com/paambaati/codeclimate-action/commit/797e381806c83961cde416008109fecfbfe9063b))
* **utils:** refactor coverage config line parser into own util ([e03d453](https://github.com/paambaati/codeclimate-action/commit/e03d4534fcf95c549b4b083f76870551d74140c1))


### Bug Fixes

* **ci:** better version tagging ([e7ede07](https://github.com/paambaati/codeclimate-action/commit/e7ede07acfbc6a654693402829004a85e680e713))
* **ci:** checkout EVERYTHING so semantic-release has all the data it could need ([a16dca5](https://github.com/paambaati/codeclimate-action/commit/a16dca5bb60d6d1ceec305e554d1d07b2e6f9f2f))
* **ci:** debug outputs ([11ed927](https://github.com/paambaati/codeclimate-action/commit/11ed9278d366c02ce89a0aa9c0266d01ed3fe78f))
* **ci:** do not cancel all matrix builds for one ([1471593](https://github.com/paambaati/codeclimate-action/commit/1471593d867e0a8171a8bbd830bc6d14647c0c73))
* **ci:** fix invalid YAML ([8f95f43](https://github.com/paambaati/codeclimate-action/commit/8f95f43e97f705d9dbb7e18d5586a16e8531d318))
* **ci:** fix the tag detection logic for new releases ([f787a56](https://github.com/paambaati/codeclimate-action/commit/f787a56de16312cc3eeff8ed0117b9cc1339a2f3))
* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** release broken release process ([746f1d2](https://github.com/paambaati/codeclimate-action/commit/746f1d233d2b6d15d77cee532065c4124db0a82c))
* **ci:** republish so latest changes get applied ([8f00eaa](https://github.com/paambaati/codeclimate-action/commit/8f00eaacd9c46d0c7351c37ce64d6f2705ae93dc))
* **ci:** republish so latest changes get applied ([fa71c1f](https://github.com/paambaati/codeclimate-action/commit/fa71c1ff7a91f7177d648c64b50c50dd9aa0d90e))
* **ci:** set up correct (?) condition to trigger publish ([3e9c9ce](https://github.com/paambaati/codeclimate-action/commit/3e9c9cefc80813bd2d9fffeb4610778e0761f2f7))
* **ci:** set up correct regex that replaces the 'v' prefixes for tags ([b3bcc0e](https://github.com/paambaati/codeclimate-action/commit/b3bcc0e23b5ab151ae0a3a2aa8dce8c6bb3bb3d7))
* **ci:** try once again to publish new version ([bcd27f6](https://github.com/paambaati/codeclimate-action/commit/bcd27f6c52b0b9daa097cb34b05c43e5040216b7))
* **ci:** use Node 22.x so the import loader will work as expected ([d56acf0](https://github.com/paambaati/codeclimate-action/commit/d56acf0f9654ca5e5e79176b57692ff3627a2561))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))
* **ci:** validate empty new release version ([2b9684a](https://github.com/paambaati/codeclimate-action/commit/2b9684a12a4089d77e5ab787677df4affaeb6ac0))
* **core:** handle globs correctly in windows ([54ac87c](https://github.com/paambaati/codeclimate-action/commit/54ac87c16480738f78a87f5e33a4a417111a550b))
* **core:** parse coverage path correctly on all platforms ([923001d](https://github.com/paambaati/codeclimate-action/commit/923001d88c62217179c085d441a5a3d54b8399e5))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([99e22b3](https://github.com/paambaati/codeclimate-action/commit/99e22b3d7de0c911c564cd391d4f9dae79ae176e))
* create hash from windows ([077e614](https://github.com/paambaati/codeclimate-action/commit/077e614c8e5c583d418676d578d063d75c198405))
* declare new environment verification option in action.yml ([3d46dc1](https://github.com/paambaati/codeclimate-action/commit/3d46dc126ca086664491c38f977bb9e4475682cd))
* **deps:** add missing dev-only dep to unblock typescript build ([9e22dcb](https://github.com/paambaati/codeclimate-action/commit/9e22dcb3b7b5b5992a31f3577cf113dc2e950e03))
* fix up last of the TS errors from tap API change ([d99b041](https://github.com/paambaati/codeclimate-action/commit/d99b041d9445249993e42c7091d3c36542347971))
* go back to tap because japa doesn't seem active ([19034a0](https://github.com/paambaati/codeclimate-action/commit/19034a0c630d64867d562ed7e06cab8149399e26))
* incorrect references to __dirname ([cb821ab](https://github.com/paambaati/codeclimate-action/commit/cb821abe7dea969cd3f252f4ba8585b57951a3d2))
* keep windows-style line endings for .bat files ([67549ff](https://github.com/paambaati/codeclimate-action/commit/67549ffc57b34e099f5bb2388d86c3cc7c347ec2))
* make sure the action can actually run as ESM ([fd0ae9c](https://github.com/paambaati/codeclimate-action/commit/fd0ae9ce7c647f5f26596719886a9c227c9afcdf))
* revert 47793be ([e512c4b](https://github.com/paambaati/codeclimate-action/commit/e512c4b5755f6d61cf87b2fe714857fe91b4af88))
* set up gitattributes to stop the line ending fuckery ([4246a36](https://github.com/paambaati/codeclimate-action/commit/4246a36c822e053c11577e679d16bf16827d6842))
* set up gitattributes to stop the line ending fuckery ([9181fd8](https://github.com/paambaati/codeclimate-action/commit/9181fd8af8132edee25fcc8df8a751d814e394c8))
* **tests:** add back missing import ([9eb6690](https://github.com/paambaati/codeclimate-action/commit/9eb669015a1fa3a9642367df2c7f03d3249ad72b))
* **tests:** additional windows-style test fixes ([def6f6d](https://github.com/paambaati/codeclimate-action/commit/def6f6d4afae91513acccff73c32708488c56b75))
* **tests:** fix tests for Windows ([18e310b](https://github.com/paambaati/codeclimate-action/commit/18e310ba76d6e1fe841d54e79d9de422dc9370d3))
* **tests:** fix the Windows path ([6e02942](https://github.com/paambaati/codeclimate-action/commit/6e029425c431d797aa38acc4943036320fe4788e))
* **tests:** make sure the special variable in script are quoted to make string comparison work ([c796f65](https://github.com/paambaati/codeclimate-action/commit/c796f651db785c619396cdbb8e09fe0c23f5dc46))
* **tests:** mock checksum verification too ([2befa84](https://github.com/paambaati/codeclimate-action/commit/2befa84d394ee779f30efbf507b9aceabfdc18ca))
* **tests:** more windows-specific test fixes ([de37362](https://github.com/paambaati/codeclimate-action/commit/de37362050b6d7216a5422f7a391e1d6380eec23))
* **tests:** more windows-specific test fixes ([e44e0a3](https://github.com/paambaati/codeclimate-action/commit/e44e0a3f3b39f96c83d6e361469ae7fec20a5521))
* **tests:** more windows-specific test fixes ([0b2f6f8](https://github.com/paambaati/codeclimate-action/commit/0b2f6f823e9a7761ee96aa4e10ea9855e814a789))
* **tests:** more windows-specific test fixes ([9a9184a](https://github.com/paambaati/codeclimate-action/commit/9a9184a38ee7d74840d8db188c814b80ff42a045))
* **tests:** more windows-specific test fixes ([1c1a7eb](https://github.com/paambaati/codeclimate-action/commit/1c1a7eb012ea910fd8c81de6dedfdaff7ce7374e))
* **tests:** more windows-specific test fixes ([8d2edab](https://github.com/paambaati/codeclimate-action/commit/8d2edab83e08094146fcf395ff2f93f803ed50e5))
* **tests:** more windows-specific test fixes ([e05d58f](https://github.com/paambaati/codeclimate-action/commit/e05d58f36f359fd2e40e1378c64a6d5c5aa83e19))
* **tests:** more windows-specific tests ([e9e87cc](https://github.com/paambaati/codeclimate-action/commit/e9e87cc514c01b5a63d3f02552e7d1a137c803fc))
* **tests:** more windows-specific tests ([13ff2e3](https://github.com/paambaati/codeclimate-action/commit/13ff2e357d666a066f84e76369c20bb78b8f669b))
* **tests:** more windows-specific tests ([80aa61e](https://github.com/paambaati/codeclimate-action/commit/80aa61ef4dffb2558582006ee27683cf5d1d304e))
* **tests:** more windows-specific tests ([498dee1](https://github.com/paambaati/codeclimate-action/commit/498dee151bf552b61d78f1cf1b5345169cff761f))
* **tests:** more windows-specific tests ([f4dff2a](https://github.com/paambaati/codeclimate-action/commit/f4dff2a761bc3d7d08071c94d452704b5b07ff2d))
* **tests:** more windows-specific tests ([4b48851](https://github.com/paambaati/codeclimate-action/commit/4b488512dd11c86232802e7bfb81c02b9b89c6e3))
* **tests:** OS-agnostic line separators for all strings ([2fc4cc3](https://github.com/paambaati/codeclimate-action/commit/2fc4cc3403ce99cfe7000fe58b8d0acb89549fb7))
* **tests:** remove windows-only test and start writing os-independent logic ([29cbd91](https://github.com/paambaati/codeclimate-action/commit/29cbd9169661bae87eccb3ae15101e9d9fa58f1b))
* **tests:** run checksum verification pre-checks only for fixtures on their own target platforms ([4dc408b](https://github.com/paambaati/codeclimate-action/commit/4dc408bc02b974db9dc9e4129c7d797e7b0a3ee1))
* **tests:** set up correct file mode on Windows ([4edff7e](https://github.com/paambaati/codeclimate-action/commit/4edff7ebe0387ebfb113739a5ab3c9101994820e))
* **tests:** set up Windows fixtures ([c29289f](https://github.com/paambaati/codeclimate-action/commit/c29289fe7fac8870265111efaaeef59bb5b6a834))
* **tests:** skip integration tests on unsupported platforms ([00e5b40](https://github.com/paambaati/codeclimate-action/commit/00e5b40552ecfd62683dfc2202ed236538468d25))
* **tests:** try correcting extra spaces in checksum files generated on Windows ([edc5e97](https://github.com/paambaati/codeclimate-action/commit/edc5e97e04929ec51a7d6b02563e518d39aff823))
* **test:** try fixing tests on Windows (maybe) ([47793be](https://github.com/paambaati/codeclimate-action/commit/47793be72fdd16ec9d6b952bbfea93ab7dc86384))
* **test:** use the @tapjs/tsx import loader to fix TS issues ([295386a](https://github.com/paambaati/codeclimate-action/commit/295386a66f5a648a1a1d048d80cb43aa738b3b75))
* try LF-only line endings for all files ([e2c94ee](https://github.com/paambaati/codeclimate-action/commit/e2c94ee03d92b6c92abd36933bea05650aac91c7))
* upgrade tap to fix the plugin issues ([f97429e](https://github.com/paambaati/codeclimate-action/commit/f97429e8c5b4a0dfc7f340cb0765fd15fc9982fd))
* **util:** follow redirects in fetch ([a258bd9](https://github.com/paambaati/codeclimate-action/commit/a258bd9f1e258160b5309cfdfd7348aeb6edc640))


### Miscellaneous Chores

* release 6.0.0 ([5c9d4de](https://github.com/paambaati/codeclimate-action/commit/5c9d4de11fe96247f3539e4e8c7cdd448b0c6dca))
* release 7.0.0 ([bae515b](https://github.com/paambaati/codeclimate-action/commit/bae515b41c8a9de774d011c8796742112d8c903f))
* release 8.0.0 ([26b2a65](https://github.com/paambaati/codeclimate-action/commit/26b2a652c38277ae8185d000fecbbbfe08e761a4))

## [8.0.0](https://github.com/paambaati/codeclimate-action/compare/v7.0.0...v8.0.0) (2024-06-12)


### ⚠ BREAKING CHANGES

* declare new environment verification option in action.yml
* new environment verification flag
* new environment verification flag
* migrate everything to ESM-only
* upgrade module to ESM
* **ci:** this doesn't change the functionality of the core action, but it does change how releases are made in the future.
* Trying to make semantic-release push a new release
* this should ideally get published as v5
* this should ideally get published as v5
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter – see codeclimate.com/changelog/7dd79ee1cf1af7141b2bd18b
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter
* **ci:** semantic-release and its process is fundamentally broken when the repo moved from master to main for its main branch. This is an attempt to try to unfuck the git log/ref notes

### core

* Support Windows ([9af890c](https://github.com/paambaati/codeclimate-action/commit/9af890ca201808293494389e160c2247062e61ab))
* Support Windows ([3434c61](https://github.com/paambaati/codeclimate-action/commit/3434c618e21bb9a4ea49f8f85e10839bef1addcd))


### Features

* **ci:** replace semantic-release with Google's release-please. ([854ea46](https://github.com/paambaati/codeclimate-action/commit/854ea46b10d7c48dc04f57be960f2257fca0ba16))
* **core/internal:** migrate to Japa as test runner. ([c909795](https://github.com/paambaati/codeclimate-action/commit/c909795d1dcb5df36fdeeff279bb457ba354f9f7))
* **core:** cleanup downloaded artifacts ([f331896](https://github.com/paambaati/codeclimate-action/commit/f3318964532e9a7bdf28c20830035973024c31bc)), closes [#639](https://github.com/paambaati/codeclimate-action/issues/639)
* **core:** migrate everything to ESM-only ([6e2b10b](https://github.com/paambaati/codeclimate-action/commit/6e2b10b46edc4c533e010d5f6df2d446de6beccf))
* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)
* **core:** Support Windows ([f0efca8](https://github.com/paambaati/codeclimate-action/commit/f0efca8d8bb2d28d2e31f5b09b3a12db580b74ed))
* **core:** Support Windows ([9787ba6](https://github.com/paambaati/codeclimate-action/commit/9787ba65355cc7e2454726ff732df574e1a6b370))
* migrate everything to ESM-only ([fed36ec](https://github.com/paambaati/codeclimate-action/commit/fed36ec1bc2a2dece8a108b769afb805aeaca1e1))
* new environment verification flag ([fa81470](https://github.com/paambaati/codeclimate-action/commit/fa81470c1bd63538aaec8ea3f8a0bb4a20964f1d))
* new environment verification flag ([6007e34](https://github.com/paambaati/codeclimate-action/commit/6007e345cd3be63fd59b5d55fd0f16edfb308ce1))
* run action using Node.js 20.x ([859e71d](https://github.com/paambaati/codeclimate-action/commit/859e71d20050925c52fd9524f5c74a0a36fba31f))
* run action using Node.js 20.x ([096c232](https://github.com/paambaati/codeclimate-action/commit/096c232e4cf323b72675683a27680ac60eead7e8))
* run action using Node.js 20.x ([7642145](https://github.com/paambaati/codeclimate-action/commit/7642145673e571d8436a9743a36d090a6f6acc5d))
* run action using Node.js 20.x ([f01d194](https://github.com/paambaati/codeclimate-action/commit/f01d1944ff5c4726c7649bf3698c1149996369bd))
* run action using Node.js 20.x ([a5d0e4f](https://github.com/paambaati/codeclimate-action/commit/a5d0e4fed50e0ae7f30c14a173467bf5651a1e8c))
* run action using Node.js 20.x ([052f893](https://github.com/paambaati/codeclimate-action/commit/052f89397e39d4b69b7f4981f7428cc626a5807c))
* upgrade module to ESM ([797e381](https://github.com/paambaati/codeclimate-action/commit/797e381806c83961cde416008109fecfbfe9063b))
* **utils:** refactor coverage config line parser into own util ([e03d453](https://github.com/paambaati/codeclimate-action/commit/e03d4534fcf95c549b4b083f76870551d74140c1))


### Bug Fixes

* **ci:** better version tagging ([e7ede07](https://github.com/paambaati/codeclimate-action/commit/e7ede07acfbc6a654693402829004a85e680e713))
* **ci:** checkout EVERYTHING so semantic-release has all the data it could need ([a16dca5](https://github.com/paambaati/codeclimate-action/commit/a16dca5bb60d6d1ceec305e554d1d07b2e6f9f2f))
* **ci:** debug outputs ([11ed927](https://github.com/paambaati/codeclimate-action/commit/11ed9278d366c02ce89a0aa9c0266d01ed3fe78f))
* **ci:** do not cancel all matrix builds for one ([1471593](https://github.com/paambaati/codeclimate-action/commit/1471593d867e0a8171a8bbd830bc6d14647c0c73))
* **ci:** fix invalid YAML ([8f95f43](https://github.com/paambaati/codeclimate-action/commit/8f95f43e97f705d9dbb7e18d5586a16e8531d318))
* **ci:** fix the tag detection logic for new releases ([f787a56](https://github.com/paambaati/codeclimate-action/commit/f787a56de16312cc3eeff8ed0117b9cc1339a2f3))
* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** release broken release process ([746f1d2](https://github.com/paambaati/codeclimate-action/commit/746f1d233d2b6d15d77cee532065c4124db0a82c))
* **ci:** republish so latest changes get applied ([8f00eaa](https://github.com/paambaati/codeclimate-action/commit/8f00eaacd9c46d0c7351c37ce64d6f2705ae93dc))
* **ci:** republish so latest changes get applied ([fa71c1f](https://github.com/paambaati/codeclimate-action/commit/fa71c1ff7a91f7177d648c64b50c50dd9aa0d90e))
* **ci:** set up correct (?) condition to trigger publish ([3e9c9ce](https://github.com/paambaati/codeclimate-action/commit/3e9c9cefc80813bd2d9fffeb4610778e0761f2f7))
* **ci:** set up correct regex that replaces the 'v' prefixes for tags ([b3bcc0e](https://github.com/paambaati/codeclimate-action/commit/b3bcc0e23b5ab151ae0a3a2aa8dce8c6bb3bb3d7))
* **ci:** try once again to publish new version ([bcd27f6](https://github.com/paambaati/codeclimate-action/commit/bcd27f6c52b0b9daa097cb34b05c43e5040216b7))
* **ci:** use Node 22.x so the import loader will work as expected ([d56acf0](https://github.com/paambaati/codeclimate-action/commit/d56acf0f9654ca5e5e79176b57692ff3627a2561))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))
* **ci:** validate empty new release version ([2b9684a](https://github.com/paambaati/codeclimate-action/commit/2b9684a12a4089d77e5ab787677df4affaeb6ac0))
* **core:** handle globs correctly in windows ([54ac87c](https://github.com/paambaati/codeclimate-action/commit/54ac87c16480738f78a87f5e33a4a417111a550b))
* **core:** parse coverage path correctly on all platforms ([923001d](https://github.com/paambaati/codeclimate-action/commit/923001d88c62217179c085d441a5a3d54b8399e5))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([99e22b3](https://github.com/paambaati/codeclimate-action/commit/99e22b3d7de0c911c564cd391d4f9dae79ae176e))
* create hash from windows ([077e614](https://github.com/paambaati/codeclimate-action/commit/077e614c8e5c583d418676d578d063d75c198405))
* declare new environment verification option in action.yml ([3d46dc1](https://github.com/paambaati/codeclimate-action/commit/3d46dc126ca086664491c38f977bb9e4475682cd))
* **deps:** add missing dev-only dep to unblock typescript build ([9e22dcb](https://github.com/paambaati/codeclimate-action/commit/9e22dcb3b7b5b5992a31f3577cf113dc2e950e03))
* fix up last of the TS errors from tap API change ([d99b041](https://github.com/paambaati/codeclimate-action/commit/d99b041d9445249993e42c7091d3c36542347971))
* go back to tap because japa doesn't seem active ([19034a0](https://github.com/paambaati/codeclimate-action/commit/19034a0c630d64867d562ed7e06cab8149399e26))
* incorrect references to __dirname ([cb821ab](https://github.com/paambaati/codeclimate-action/commit/cb821abe7dea969cd3f252f4ba8585b57951a3d2))
* keep windows-style line endings for .bat files ([67549ff](https://github.com/paambaati/codeclimate-action/commit/67549ffc57b34e099f5bb2388d86c3cc7c347ec2))
* make sure the action can actually run as ESM ([fd0ae9c](https://github.com/paambaati/codeclimate-action/commit/fd0ae9ce7c647f5f26596719886a9c227c9afcdf))
* revert 47793be ([e512c4b](https://github.com/paambaati/codeclimate-action/commit/e512c4b5755f6d61cf87b2fe714857fe91b4af88))
* set up gitattributes to stop the line ending fuckery ([4246a36](https://github.com/paambaati/codeclimate-action/commit/4246a36c822e053c11577e679d16bf16827d6842))
* set up gitattributes to stop the line ending fuckery ([9181fd8](https://github.com/paambaati/codeclimate-action/commit/9181fd8af8132edee25fcc8df8a751d814e394c8))
* **tests:** add back missing import ([9eb6690](https://github.com/paambaati/codeclimate-action/commit/9eb669015a1fa3a9642367df2c7f03d3249ad72b))
* **tests:** additional windows-style test fixes ([def6f6d](https://github.com/paambaati/codeclimate-action/commit/def6f6d4afae91513acccff73c32708488c56b75))
* **tests:** fix tests for Windows ([18e310b](https://github.com/paambaati/codeclimate-action/commit/18e310ba76d6e1fe841d54e79d9de422dc9370d3))
* **tests:** fix the Windows path ([6e02942](https://github.com/paambaati/codeclimate-action/commit/6e029425c431d797aa38acc4943036320fe4788e))
* **tests:** make sure the special variable in script are quoted to make string comparison work ([c796f65](https://github.com/paambaati/codeclimate-action/commit/c796f651db785c619396cdbb8e09fe0c23f5dc46))
* **tests:** mock checksum verification too ([2befa84](https://github.com/paambaati/codeclimate-action/commit/2befa84d394ee779f30efbf507b9aceabfdc18ca))
* **tests:** more windows-specific test fixes ([de37362](https://github.com/paambaati/codeclimate-action/commit/de37362050b6d7216a5422f7a391e1d6380eec23))
* **tests:** more windows-specific test fixes ([e44e0a3](https://github.com/paambaati/codeclimate-action/commit/e44e0a3f3b39f96c83d6e361469ae7fec20a5521))
* **tests:** more windows-specific test fixes ([0b2f6f8](https://github.com/paambaati/codeclimate-action/commit/0b2f6f823e9a7761ee96aa4e10ea9855e814a789))
* **tests:** more windows-specific test fixes ([9a9184a](https://github.com/paambaati/codeclimate-action/commit/9a9184a38ee7d74840d8db188c814b80ff42a045))
* **tests:** more windows-specific test fixes ([1c1a7eb](https://github.com/paambaati/codeclimate-action/commit/1c1a7eb012ea910fd8c81de6dedfdaff7ce7374e))
* **tests:** more windows-specific test fixes ([8d2edab](https://github.com/paambaati/codeclimate-action/commit/8d2edab83e08094146fcf395ff2f93f803ed50e5))
* **tests:** more windows-specific test fixes ([e05d58f](https://github.com/paambaati/codeclimate-action/commit/e05d58f36f359fd2e40e1378c64a6d5c5aa83e19))
* **tests:** more windows-specific tests ([e9e87cc](https://github.com/paambaati/codeclimate-action/commit/e9e87cc514c01b5a63d3f02552e7d1a137c803fc))
* **tests:** more windows-specific tests ([13ff2e3](https://github.com/paambaati/codeclimate-action/commit/13ff2e357d666a066f84e76369c20bb78b8f669b))
* **tests:** more windows-specific tests ([80aa61e](https://github.com/paambaati/codeclimate-action/commit/80aa61ef4dffb2558582006ee27683cf5d1d304e))
* **tests:** more windows-specific tests ([498dee1](https://github.com/paambaati/codeclimate-action/commit/498dee151bf552b61d78f1cf1b5345169cff761f))
* **tests:** more windows-specific tests ([f4dff2a](https://github.com/paambaati/codeclimate-action/commit/f4dff2a761bc3d7d08071c94d452704b5b07ff2d))
* **tests:** more windows-specific tests ([4b48851](https://github.com/paambaati/codeclimate-action/commit/4b488512dd11c86232802e7bfb81c02b9b89c6e3))
* **tests:** OS-agnostic line separators for all strings ([2fc4cc3](https://github.com/paambaati/codeclimate-action/commit/2fc4cc3403ce99cfe7000fe58b8d0acb89549fb7))
* **tests:** remove windows-only test and start writing os-independent logic ([29cbd91](https://github.com/paambaati/codeclimate-action/commit/29cbd9169661bae87eccb3ae15101e9d9fa58f1b))
* **tests:** run checksum verification pre-checks only for fixtures on their own target platforms ([4dc408b](https://github.com/paambaati/codeclimate-action/commit/4dc408bc02b974db9dc9e4129c7d797e7b0a3ee1))
* **tests:** set up correct file mode on Windows ([4edff7e](https://github.com/paambaati/codeclimate-action/commit/4edff7ebe0387ebfb113739a5ab3c9101994820e))
* **tests:** set up Windows fixtures ([c29289f](https://github.com/paambaati/codeclimate-action/commit/c29289fe7fac8870265111efaaeef59bb5b6a834))
* **tests:** skip integration tests on unsupported platforms ([00e5b40](https://github.com/paambaati/codeclimate-action/commit/00e5b40552ecfd62683dfc2202ed236538468d25))
* **tests:** try correcting extra spaces in checksum files generated on Windows ([edc5e97](https://github.com/paambaati/codeclimate-action/commit/edc5e97e04929ec51a7d6b02563e518d39aff823))
* **test:** try fixing tests on Windows (maybe) ([47793be](https://github.com/paambaati/codeclimate-action/commit/47793be72fdd16ec9d6b952bbfea93ab7dc86384))
* **test:** use the @tapjs/tsx import loader to fix TS issues ([295386a](https://github.com/paambaati/codeclimate-action/commit/295386a66f5a648a1a1d048d80cb43aa738b3b75))
* try LF-only line endings for all files ([e2c94ee](https://github.com/paambaati/codeclimate-action/commit/e2c94ee03d92b6c92abd36933bea05650aac91c7))
* upgrade tap to fix the plugin issues ([f97429e](https://github.com/paambaati/codeclimate-action/commit/f97429e8c5b4a0dfc7f340cb0765fd15fc9982fd))
* **util:** follow redirects in fetch ([a258bd9](https://github.com/paambaati/codeclimate-action/commit/a258bd9f1e258160b5309cfdfd7348aeb6edc640))


### Miscellaneous Chores

* release 6.0.0 ([5c9d4de](https://github.com/paambaati/codeclimate-action/commit/5c9d4de11fe96247f3539e4e8c7cdd448b0c6dca))
* release 7.0.0 ([bae515b](https://github.com/paambaati/codeclimate-action/commit/bae515b41c8a9de774d011c8796742112d8c903f))
* release 8.0.0 ([26b2a65](https://github.com/paambaati/codeclimate-action/commit/26b2a652c38277ae8185d000fecbbbfe08e761a4))

## [7.0.0](https://github.com/paambaati/codeclimate-action/compare/v6.0.0...v7.0.0) (2024-06-12)


### ⚠ BREAKING CHANGES

* new environment verification flag
* new environment verification flag
* migrate everything to ESM-only
* upgrade module to ESM
* **ci:** this doesn't change the functionality of the core action, but it does change how releases are made in the future.
* Trying to make semantic-release push a new release
* this should ideally get published as v5
* this should ideally get published as v5
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter – see codeclimate.com/changelog/7dd79ee1cf1af7141b2bd18b
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter
* **ci:** semantic-release and its process is fundamentally broken when the repo moved from master to main for its main branch. This is an attempt to try to unfuck the git log/ref notes

### core

* Support Windows ([9af890c](https://github.com/paambaati/codeclimate-action/commit/9af890ca201808293494389e160c2247062e61ab))
* Support Windows ([3434c61](https://github.com/paambaati/codeclimate-action/commit/3434c618e21bb9a4ea49f8f85e10839bef1addcd))


### Features

* **ci:** replace semantic-release with Google's release-please. ([854ea46](https://github.com/paambaati/codeclimate-action/commit/854ea46b10d7c48dc04f57be960f2257fca0ba16))
* **core/internal:** migrate to Japa as test runner. ([c909795](https://github.com/paambaati/codeclimate-action/commit/c909795d1dcb5df36fdeeff279bb457ba354f9f7))
* **core:** cleanup downloaded artifacts ([f331896](https://github.com/paambaati/codeclimate-action/commit/f3318964532e9a7bdf28c20830035973024c31bc)), closes [#639](https://github.com/paambaati/codeclimate-action/issues/639)
* **core:** migrate everything to ESM-only ([6e2b10b](https://github.com/paambaati/codeclimate-action/commit/6e2b10b46edc4c533e010d5f6df2d446de6beccf))
* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)
* **core:** Support Windows ([f0efca8](https://github.com/paambaati/codeclimate-action/commit/f0efca8d8bb2d28d2e31f5b09b3a12db580b74ed))
* **core:** Support Windows ([9787ba6](https://github.com/paambaati/codeclimate-action/commit/9787ba65355cc7e2454726ff732df574e1a6b370))
* migrate everything to ESM-only ([fed36ec](https://github.com/paambaati/codeclimate-action/commit/fed36ec1bc2a2dece8a108b769afb805aeaca1e1))
* new environment verification flag ([fa81470](https://github.com/paambaati/codeclimate-action/commit/fa81470c1bd63538aaec8ea3f8a0bb4a20964f1d))
* new environment verification flag ([6007e34](https://github.com/paambaati/codeclimate-action/commit/6007e345cd3be63fd59b5d55fd0f16edfb308ce1))
* run action using Node.js 20.x ([859e71d](https://github.com/paambaati/codeclimate-action/commit/859e71d20050925c52fd9524f5c74a0a36fba31f))
* run action using Node.js 20.x ([096c232](https://github.com/paambaati/codeclimate-action/commit/096c232e4cf323b72675683a27680ac60eead7e8))
* run action using Node.js 20.x ([7642145](https://github.com/paambaati/codeclimate-action/commit/7642145673e571d8436a9743a36d090a6f6acc5d))
* run action using Node.js 20.x ([f01d194](https://github.com/paambaati/codeclimate-action/commit/f01d1944ff5c4726c7649bf3698c1149996369bd))
* run action using Node.js 20.x ([a5d0e4f](https://github.com/paambaati/codeclimate-action/commit/a5d0e4fed50e0ae7f30c14a173467bf5651a1e8c))
* run action using Node.js 20.x ([052f893](https://github.com/paambaati/codeclimate-action/commit/052f89397e39d4b69b7f4981f7428cc626a5807c))
* upgrade module to ESM ([797e381](https://github.com/paambaati/codeclimate-action/commit/797e381806c83961cde416008109fecfbfe9063b))
* **utils:** refactor coverage config line parser into own util ([e03d453](https://github.com/paambaati/codeclimate-action/commit/e03d4534fcf95c549b4b083f76870551d74140c1))


### Bug Fixes

* **ci:** better version tagging ([e7ede07](https://github.com/paambaati/codeclimate-action/commit/e7ede07acfbc6a654693402829004a85e680e713))
* **ci:** checkout EVERYTHING so semantic-release has all the data it could need ([a16dca5](https://github.com/paambaati/codeclimate-action/commit/a16dca5bb60d6d1ceec305e554d1d07b2e6f9f2f))
* **ci:** debug outputs ([11ed927](https://github.com/paambaati/codeclimate-action/commit/11ed9278d366c02ce89a0aa9c0266d01ed3fe78f))
* **ci:** do not cancel all matrix builds for one ([1471593](https://github.com/paambaati/codeclimate-action/commit/1471593d867e0a8171a8bbd830bc6d14647c0c73))
* **ci:** fix invalid YAML ([8f95f43](https://github.com/paambaati/codeclimate-action/commit/8f95f43e97f705d9dbb7e18d5586a16e8531d318))
* **ci:** fix the tag detection logic for new releases ([f787a56](https://github.com/paambaati/codeclimate-action/commit/f787a56de16312cc3eeff8ed0117b9cc1339a2f3))
* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** release broken release process ([746f1d2](https://github.com/paambaati/codeclimate-action/commit/746f1d233d2b6d15d77cee532065c4124db0a82c))
* **ci:** republish so latest changes get applied ([8f00eaa](https://github.com/paambaati/codeclimate-action/commit/8f00eaacd9c46d0c7351c37ce64d6f2705ae93dc))
* **ci:** republish so latest changes get applied ([fa71c1f](https://github.com/paambaati/codeclimate-action/commit/fa71c1ff7a91f7177d648c64b50c50dd9aa0d90e))
* **ci:** set up correct (?) condition to trigger publish ([3e9c9ce](https://github.com/paambaati/codeclimate-action/commit/3e9c9cefc80813bd2d9fffeb4610778e0761f2f7))
* **ci:** set up correct regex that replaces the 'v' prefixes for tags ([b3bcc0e](https://github.com/paambaati/codeclimate-action/commit/b3bcc0e23b5ab151ae0a3a2aa8dce8c6bb3bb3d7))
* **ci:** try once again to publish new version ([bcd27f6](https://github.com/paambaati/codeclimate-action/commit/bcd27f6c52b0b9daa097cb34b05c43e5040216b7))
* **ci:** use Node 22.x so the import loader will work as expected ([d56acf0](https://github.com/paambaati/codeclimate-action/commit/d56acf0f9654ca5e5e79176b57692ff3627a2561))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))
* **ci:** validate empty new release version ([2b9684a](https://github.com/paambaati/codeclimate-action/commit/2b9684a12a4089d77e5ab787677df4affaeb6ac0))
* **core:** handle globs correctly in windows ([54ac87c](https://github.com/paambaati/codeclimate-action/commit/54ac87c16480738f78a87f5e33a4a417111a550b))
* **core:** parse coverage path correctly on all platforms ([923001d](https://github.com/paambaati/codeclimate-action/commit/923001d88c62217179c085d441a5a3d54b8399e5))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([99e22b3](https://github.com/paambaati/codeclimate-action/commit/99e22b3d7de0c911c564cd391d4f9dae79ae176e))
* create hash from windows ([077e614](https://github.com/paambaati/codeclimate-action/commit/077e614c8e5c583d418676d578d063d75c198405))
* **deps:** add missing dev-only dep to unblock typescript build ([9e22dcb](https://github.com/paambaati/codeclimate-action/commit/9e22dcb3b7b5b5992a31f3577cf113dc2e950e03))
* fix up last of the TS errors from tap API change ([d99b041](https://github.com/paambaati/codeclimate-action/commit/d99b041d9445249993e42c7091d3c36542347971))
* go back to tap because japa doesn't seem active ([19034a0](https://github.com/paambaati/codeclimate-action/commit/19034a0c630d64867d562ed7e06cab8149399e26))
* incorrect references to __dirname ([cb821ab](https://github.com/paambaati/codeclimate-action/commit/cb821abe7dea969cd3f252f4ba8585b57951a3d2))
* keep windows-style line endings for .bat files ([67549ff](https://github.com/paambaati/codeclimate-action/commit/67549ffc57b34e099f5bb2388d86c3cc7c347ec2))
* revert 47793be ([e512c4b](https://github.com/paambaati/codeclimate-action/commit/e512c4b5755f6d61cf87b2fe714857fe91b4af88))
* set up gitattributes to stop the line ending fuckery ([4246a36](https://github.com/paambaati/codeclimate-action/commit/4246a36c822e053c11577e679d16bf16827d6842))
* set up gitattributes to stop the line ending fuckery ([9181fd8](https://github.com/paambaati/codeclimate-action/commit/9181fd8af8132edee25fcc8df8a751d814e394c8))
* **tests:** add back missing import ([9eb6690](https://github.com/paambaati/codeclimate-action/commit/9eb669015a1fa3a9642367df2c7f03d3249ad72b))
* **tests:** additional windows-style test fixes ([def6f6d](https://github.com/paambaati/codeclimate-action/commit/def6f6d4afae91513acccff73c32708488c56b75))
* **tests:** fix tests for Windows ([18e310b](https://github.com/paambaati/codeclimate-action/commit/18e310ba76d6e1fe841d54e79d9de422dc9370d3))
* **tests:** fix the Windows path ([6e02942](https://github.com/paambaati/codeclimate-action/commit/6e029425c431d797aa38acc4943036320fe4788e))
* **tests:** make sure the special variable in script are quoted to make string comparison work ([c796f65](https://github.com/paambaati/codeclimate-action/commit/c796f651db785c619396cdbb8e09fe0c23f5dc46))
* **tests:** mock checksum verification too ([2befa84](https://github.com/paambaati/codeclimate-action/commit/2befa84d394ee779f30efbf507b9aceabfdc18ca))
* **tests:** more windows-specific test fixes ([de37362](https://github.com/paambaati/codeclimate-action/commit/de37362050b6d7216a5422f7a391e1d6380eec23))
* **tests:** more windows-specific test fixes ([e44e0a3](https://github.com/paambaati/codeclimate-action/commit/e44e0a3f3b39f96c83d6e361469ae7fec20a5521))
* **tests:** more windows-specific test fixes ([0b2f6f8](https://github.com/paambaati/codeclimate-action/commit/0b2f6f823e9a7761ee96aa4e10ea9855e814a789))
* **tests:** more windows-specific test fixes ([9a9184a](https://github.com/paambaati/codeclimate-action/commit/9a9184a38ee7d74840d8db188c814b80ff42a045))
* **tests:** more windows-specific test fixes ([1c1a7eb](https://github.com/paambaati/codeclimate-action/commit/1c1a7eb012ea910fd8c81de6dedfdaff7ce7374e))
* **tests:** more windows-specific test fixes ([8d2edab](https://github.com/paambaati/codeclimate-action/commit/8d2edab83e08094146fcf395ff2f93f803ed50e5))
* **tests:** more windows-specific test fixes ([e05d58f](https://github.com/paambaati/codeclimate-action/commit/e05d58f36f359fd2e40e1378c64a6d5c5aa83e19))
* **tests:** more windows-specific tests ([e9e87cc](https://github.com/paambaati/codeclimate-action/commit/e9e87cc514c01b5a63d3f02552e7d1a137c803fc))
* **tests:** more windows-specific tests ([13ff2e3](https://github.com/paambaati/codeclimate-action/commit/13ff2e357d666a066f84e76369c20bb78b8f669b))
* **tests:** more windows-specific tests ([80aa61e](https://github.com/paambaati/codeclimate-action/commit/80aa61ef4dffb2558582006ee27683cf5d1d304e))
* **tests:** more windows-specific tests ([498dee1](https://github.com/paambaati/codeclimate-action/commit/498dee151bf552b61d78f1cf1b5345169cff761f))
* **tests:** more windows-specific tests ([f4dff2a](https://github.com/paambaati/codeclimate-action/commit/f4dff2a761bc3d7d08071c94d452704b5b07ff2d))
* **tests:** more windows-specific tests ([4b48851](https://github.com/paambaati/codeclimate-action/commit/4b488512dd11c86232802e7bfb81c02b9b89c6e3))
* **tests:** OS-agnostic line separators for all strings ([2fc4cc3](https://github.com/paambaati/codeclimate-action/commit/2fc4cc3403ce99cfe7000fe58b8d0acb89549fb7))
* **tests:** remove windows-only test and start writing os-independent logic ([29cbd91](https://github.com/paambaati/codeclimate-action/commit/29cbd9169661bae87eccb3ae15101e9d9fa58f1b))
* **tests:** run checksum verification pre-checks only for fixtures on their own target platforms ([4dc408b](https://github.com/paambaati/codeclimate-action/commit/4dc408bc02b974db9dc9e4129c7d797e7b0a3ee1))
* **tests:** set up correct file mode on Windows ([4edff7e](https://github.com/paambaati/codeclimate-action/commit/4edff7ebe0387ebfb113739a5ab3c9101994820e))
* **tests:** set up Windows fixtures ([c29289f](https://github.com/paambaati/codeclimate-action/commit/c29289fe7fac8870265111efaaeef59bb5b6a834))
* **tests:** skip integration tests on unsupported platforms ([00e5b40](https://github.com/paambaati/codeclimate-action/commit/00e5b40552ecfd62683dfc2202ed236538468d25))
* **tests:** try correcting extra spaces in checksum files generated on Windows ([edc5e97](https://github.com/paambaati/codeclimate-action/commit/edc5e97e04929ec51a7d6b02563e518d39aff823))
* **test:** try fixing tests on Windows (maybe) ([47793be](https://github.com/paambaati/codeclimate-action/commit/47793be72fdd16ec9d6b952bbfea93ab7dc86384))
* **test:** use the @tapjs/tsx import loader to fix TS issues ([295386a](https://github.com/paambaati/codeclimate-action/commit/295386a66f5a648a1a1d048d80cb43aa738b3b75))
* try LF-only line endings for all files ([e2c94ee](https://github.com/paambaati/codeclimate-action/commit/e2c94ee03d92b6c92abd36933bea05650aac91c7))
* upgrade tap to fix the plugin issues ([f97429e](https://github.com/paambaati/codeclimate-action/commit/f97429e8c5b4a0dfc7f340cb0765fd15fc9982fd))
* **util:** follow redirects in fetch ([a258bd9](https://github.com/paambaati/codeclimate-action/commit/a258bd9f1e258160b5309cfdfd7348aeb6edc640))


### Miscellaneous Chores

* release 6.0.0 ([5c9d4de](https://github.com/paambaati/codeclimate-action/commit/5c9d4de11fe96247f3539e4e8c7cdd448b0c6dca))
* release 7.0.0 ([bae515b](https://github.com/paambaati/codeclimate-action/commit/bae515b41c8a9de774d011c8796742112d8c903f))

## [6.0.0](https://github.com/paambaati/codeclimate-action/compare/v5.0.0...v6.0.0) (2024-04-26)


### ⚠ BREAKING CHANGES

* **ci:** this doesn't change the functionality of the core action, but it does change how releases are made in the future.
* Trying to make semantic-release push a new release
* this should ideally get published as v5
* this should ideally get published as v5
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter – see codeclimate.com/changelog/7dd79ee1cf1af7141b2bd18b
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter
* **ci:** semantic-release and its process is fundamentally broken when the repo moved from master to main for its main branch. This is an attempt to try to unfuck the git log/ref notes

### core

* Support Windows ([9af890c](https://github.com/paambaati/codeclimate-action/commit/9af890ca201808293494389e160c2247062e61ab))
* Support Windows ([3434c61](https://github.com/paambaati/codeclimate-action/commit/3434c618e21bb9a4ea49f8f85e10839bef1addcd))


### Features

* **ci:** replace semantic-release with Google's release-please. ([854ea46](https://github.com/paambaati/codeclimate-action/commit/854ea46b10d7c48dc04f57be960f2257fca0ba16))
* **core:** cleanup downloaded artifacts ([f331896](https://github.com/paambaati/codeclimate-action/commit/f3318964532e9a7bdf28c20830035973024c31bc)), closes [#639](https://github.com/paambaati/codeclimate-action/issues/639)
* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)
* **core:** Support Windows ([f0efca8](https://github.com/paambaati/codeclimate-action/commit/f0efca8d8bb2d28d2e31f5b09b3a12db580b74ed))
* **core:** Support Windows ([9787ba6](https://github.com/paambaati/codeclimate-action/commit/9787ba65355cc7e2454726ff732df574e1a6b370))
* run action using Node.js 20.x ([859e71d](https://github.com/paambaati/codeclimate-action/commit/859e71d20050925c52fd9524f5c74a0a36fba31f))
* run action using Node.js 20.x ([096c232](https://github.com/paambaati/codeclimate-action/commit/096c232e4cf323b72675683a27680ac60eead7e8))
* run action using Node.js 20.x ([7642145](https://github.com/paambaati/codeclimate-action/commit/7642145673e571d8436a9743a36d090a6f6acc5d))
* run action using Node.js 20.x ([f01d194](https://github.com/paambaati/codeclimate-action/commit/f01d1944ff5c4726c7649bf3698c1149996369bd))
* run action using Node.js 20.x ([a5d0e4f](https://github.com/paambaati/codeclimate-action/commit/a5d0e4fed50e0ae7f30c14a173467bf5651a1e8c))
* run action using Node.js 20.x ([052f893](https://github.com/paambaati/codeclimate-action/commit/052f89397e39d4b69b7f4981f7428cc626a5807c))
* **utils:** refactor coverage config line parser into own util ([e03d453](https://github.com/paambaati/codeclimate-action/commit/e03d4534fcf95c549b4b083f76870551d74140c1))


### Bug Fixes

* **ci:** better version tagging ([e7ede07](https://github.com/paambaati/codeclimate-action/commit/e7ede07acfbc6a654693402829004a85e680e713))
* **ci:** checkout EVERYTHING so semantic-release has all the data it could need ([a16dca5](https://github.com/paambaati/codeclimate-action/commit/a16dca5bb60d6d1ceec305e554d1d07b2e6f9f2f))
* **ci:** debug outputs ([11ed927](https://github.com/paambaati/codeclimate-action/commit/11ed9278d366c02ce89a0aa9c0266d01ed3fe78f))
* **ci:** do not cancel all matrix builds for one ([1471593](https://github.com/paambaati/codeclimate-action/commit/1471593d867e0a8171a8bbd830bc6d14647c0c73))
* **ci:** fix invalid YAML ([8f95f43](https://github.com/paambaati/codeclimate-action/commit/8f95f43e97f705d9dbb7e18d5586a16e8531d318))
* **ci:** fix the tag detection logic for new releases ([f787a56](https://github.com/paambaati/codeclimate-action/commit/f787a56de16312cc3eeff8ed0117b9cc1339a2f3))
* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** release broken release process ([746f1d2](https://github.com/paambaati/codeclimate-action/commit/746f1d233d2b6d15d77cee532065c4124db0a82c))
* **ci:** republish so latest changes get applied ([8f00eaa](https://github.com/paambaati/codeclimate-action/commit/8f00eaacd9c46d0c7351c37ce64d6f2705ae93dc))
* **ci:** republish so latest changes get applied ([fa71c1f](https://github.com/paambaati/codeclimate-action/commit/fa71c1ff7a91f7177d648c64b50c50dd9aa0d90e))
* **ci:** set up correct (?) condition to trigger publish ([3e9c9ce](https://github.com/paambaati/codeclimate-action/commit/3e9c9cefc80813bd2d9fffeb4610778e0761f2f7))
* **ci:** set up correct regex that replaces the 'v' prefixes for tags ([b3bcc0e](https://github.com/paambaati/codeclimate-action/commit/b3bcc0e23b5ab151ae0a3a2aa8dce8c6bb3bb3d7))
* **ci:** try once again to publish new version ([bcd27f6](https://github.com/paambaati/codeclimate-action/commit/bcd27f6c52b0b9daa097cb34b05c43e5040216b7))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))
* **ci:** validate empty new release version ([2b9684a](https://github.com/paambaati/codeclimate-action/commit/2b9684a12a4089d77e5ab787677df4affaeb6ac0))
* **core:** handle globs correctly in windows ([54ac87c](https://github.com/paambaati/codeclimate-action/commit/54ac87c16480738f78a87f5e33a4a417111a550b))
* **core:** parse coverage path correctly on all platforms ([923001d](https://github.com/paambaati/codeclimate-action/commit/923001d88c62217179c085d441a5a3d54b8399e5))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([99e22b3](https://github.com/paambaati/codeclimate-action/commit/99e22b3d7de0c911c564cd391d4f9dae79ae176e))
* create hash from windows ([077e614](https://github.com/paambaati/codeclimate-action/commit/077e614c8e5c583d418676d578d063d75c198405))
* **deps:** add missing dev-only dep to unblock typescript build ([9e22dcb](https://github.com/paambaati/codeclimate-action/commit/9e22dcb3b7b5b5992a31f3577cf113dc2e950e03))
* keep windows-style line endings for .bat files ([67549ff](https://github.com/paambaati/codeclimate-action/commit/67549ffc57b34e099f5bb2388d86c3cc7c347ec2))
* set up gitattributes to stop the line ending fuckery ([4246a36](https://github.com/paambaati/codeclimate-action/commit/4246a36c822e053c11577e679d16bf16827d6842))
* set up gitattributes to stop the line ending fuckery ([9181fd8](https://github.com/paambaati/codeclimate-action/commit/9181fd8af8132edee25fcc8df8a751d814e394c8))
* **tests:** additional windows-style test fixes ([def6f6d](https://github.com/paambaati/codeclimate-action/commit/def6f6d4afae91513acccff73c32708488c56b75))
* **tests:** fix tests for Windows ([18e310b](https://github.com/paambaati/codeclimate-action/commit/18e310ba76d6e1fe841d54e79d9de422dc9370d3))
* **tests:** fix the Windows path ([6e02942](https://github.com/paambaati/codeclimate-action/commit/6e029425c431d797aa38acc4943036320fe4788e))
* **tests:** make sure the special variable in script are quoted to make string comparison work ([c796f65](https://github.com/paambaati/codeclimate-action/commit/c796f651db785c619396cdbb8e09fe0c23f5dc46))
* **tests:** mock checksum verification too ([2befa84](https://github.com/paambaati/codeclimate-action/commit/2befa84d394ee779f30efbf507b9aceabfdc18ca))
* **tests:** more windows-specific test fixes ([de37362](https://github.com/paambaati/codeclimate-action/commit/de37362050b6d7216a5422f7a391e1d6380eec23))
* **tests:** more windows-specific test fixes ([e44e0a3](https://github.com/paambaati/codeclimate-action/commit/e44e0a3f3b39f96c83d6e361469ae7fec20a5521))
* **tests:** more windows-specific test fixes ([0b2f6f8](https://github.com/paambaati/codeclimate-action/commit/0b2f6f823e9a7761ee96aa4e10ea9855e814a789))
* **tests:** more windows-specific test fixes ([9a9184a](https://github.com/paambaati/codeclimate-action/commit/9a9184a38ee7d74840d8db188c814b80ff42a045))
* **tests:** more windows-specific test fixes ([1c1a7eb](https://github.com/paambaati/codeclimate-action/commit/1c1a7eb012ea910fd8c81de6dedfdaff7ce7374e))
* **tests:** more windows-specific test fixes ([8d2edab](https://github.com/paambaati/codeclimate-action/commit/8d2edab83e08094146fcf395ff2f93f803ed50e5))
* **tests:** more windows-specific test fixes ([e05d58f](https://github.com/paambaati/codeclimate-action/commit/e05d58f36f359fd2e40e1378c64a6d5c5aa83e19))
* **tests:** more windows-specific tests ([e9e87cc](https://github.com/paambaati/codeclimate-action/commit/e9e87cc514c01b5a63d3f02552e7d1a137c803fc))
* **tests:** more windows-specific tests ([13ff2e3](https://github.com/paambaati/codeclimate-action/commit/13ff2e357d666a066f84e76369c20bb78b8f669b))
* **tests:** more windows-specific tests ([80aa61e](https://github.com/paambaati/codeclimate-action/commit/80aa61ef4dffb2558582006ee27683cf5d1d304e))
* **tests:** more windows-specific tests ([498dee1](https://github.com/paambaati/codeclimate-action/commit/498dee151bf552b61d78f1cf1b5345169cff761f))
* **tests:** more windows-specific tests ([f4dff2a](https://github.com/paambaati/codeclimate-action/commit/f4dff2a761bc3d7d08071c94d452704b5b07ff2d))
* **tests:** more windows-specific tests ([4b48851](https://github.com/paambaati/codeclimate-action/commit/4b488512dd11c86232802e7bfb81c02b9b89c6e3))
* **tests:** OS-agnostic line separators for all strings ([2fc4cc3](https://github.com/paambaati/codeclimate-action/commit/2fc4cc3403ce99cfe7000fe58b8d0acb89549fb7))
* **tests:** remove windows-only test and start writing os-independent logic ([29cbd91](https://github.com/paambaati/codeclimate-action/commit/29cbd9169661bae87eccb3ae15101e9d9fa58f1b))
* **tests:** run checksum verification pre-checks only for fixtures on their own target platforms ([4dc408b](https://github.com/paambaati/codeclimate-action/commit/4dc408bc02b974db9dc9e4129c7d797e7b0a3ee1))
* **tests:** set up correct file mode on Windows ([4edff7e](https://github.com/paambaati/codeclimate-action/commit/4edff7ebe0387ebfb113739a5ab3c9101994820e))
* **tests:** set up Windows fixtures ([c29289f](https://github.com/paambaati/codeclimate-action/commit/c29289fe7fac8870265111efaaeef59bb5b6a834))
* **tests:** skip integration tests on unsupported platforms ([00e5b40](https://github.com/paambaati/codeclimate-action/commit/00e5b40552ecfd62683dfc2202ed236538468d25))
* **tests:** try correcting extra spaces in checksum files generated on Windows ([edc5e97](https://github.com/paambaati/codeclimate-action/commit/edc5e97e04929ec51a7d6b02563e518d39aff823))
* try LF-only line endings for all files ([e2c94ee](https://github.com/paambaati/codeclimate-action/commit/e2c94ee03d92b6c92abd36933bea05650aac91c7))
* **util:** follow redirects in fetch ([a258bd9](https://github.com/paambaati/codeclimate-action/commit/a258bd9f1e258160b5309cfdfd7348aeb6edc640))


### Miscellaneous Chores

* release 6.0.0 ([5c9d4de](https://github.com/paambaati/codeclimate-action/commit/5c9d4de11fe96247f3539e4e8c7cdd448b0c6dca))

## [5.0.0](https://github.com/paambaati/codeclimate-action/compare/v4.0.0...v5.0.0) (2023-07-06)


### Bug Fixes

* **ci:** checkout EVERYTHING so semantic-release has all the data it could need ([a16dca5](https://github.com/paambaati/codeclimate-action/commit/a16dca5bb60d6d1ceec305e554d1d07b2e6f9f2f))
* **ci:** do not cancel all matrix builds for one ([1471593](https://github.com/paambaati/codeclimate-action/commit/1471593d867e0a8171a8bbd830bc6d14647c0c73))
* **ci:** set up correct regex that replaces the 'v' prefixes for tags ([b3bcc0e](https://github.com/paambaati/codeclimate-action/commit/b3bcc0e23b5ab151ae0a3a2aa8dce8c6bb3bb3d7))
* **core:** handle globs correctly in windows ([54ac87c](https://github.com/paambaati/codeclimate-action/commit/54ac87c16480738f78a87f5e33a4a417111a550b))
* **core:** parse coverage path correctly on all platforms ([923001d](https://github.com/paambaati/codeclimate-action/commit/923001d88c62217179c085d441a5a3d54b8399e5))
* create hash from windows ([077e614](https://github.com/paambaati/codeclimate-action/commit/077e614c8e5c583d418676d578d063d75c198405))
* keep windows-style line endings for .bat files ([67549ff](https://github.com/paambaati/codeclimate-action/commit/67549ffc57b34e099f5bb2388d86c3cc7c347ec2))
* set up gitattributes to stop the line ending fuckery ([4246a36](https://github.com/paambaati/codeclimate-action/commit/4246a36c822e053c11577e679d16bf16827d6842))
* set up gitattributes to stop the line ending fuckery ([9181fd8](https://github.com/paambaati/codeclimate-action/commit/9181fd8af8132edee25fcc8df8a751d814e394c8))
* **tests:** additional windows-style test fixes ([def6f6d](https://github.com/paambaati/codeclimate-action/commit/def6f6d4afae91513acccff73c32708488c56b75))
* **tests:** fix tests for Windows ([18e310b](https://github.com/paambaati/codeclimate-action/commit/18e310ba76d6e1fe841d54e79d9de422dc9370d3))
* **tests:** fix the Windows path ([6e02942](https://github.com/paambaati/codeclimate-action/commit/6e029425c431d797aa38acc4943036320fe4788e)), closes [/github.com/ljharb/tape/issues/593#issuecomment-1537292595](https://github.com//github.com/ljharb/tape/issues/593/issues/issuecomment-1537292595)
* **tests:** make sure the special variable in script are quoted to make string comparison work ([c796f65](https://github.com/paambaati/codeclimate-action/commit/c796f651db785c619396cdbb8e09fe0c23f5dc46))
* **tests:** mock checksum verification too ([2befa84](https://github.com/paambaati/codeclimate-action/commit/2befa84d394ee779f30efbf507b9aceabfdc18ca))
* **tests:** more windows-specific test fixes ([de37362](https://github.com/paambaati/codeclimate-action/commit/de37362050b6d7216a5422f7a391e1d6380eec23))
* **tests:** more windows-specific test fixes ([e44e0a3](https://github.com/paambaati/codeclimate-action/commit/e44e0a3f3b39f96c83d6e361469ae7fec20a5521))
* **tests:** more windows-specific test fixes ([0b2f6f8](https://github.com/paambaati/codeclimate-action/commit/0b2f6f823e9a7761ee96aa4e10ea9855e814a789))
* **tests:** more windows-specific test fixes ([9a9184a](https://github.com/paambaati/codeclimate-action/commit/9a9184a38ee7d74840d8db188c814b80ff42a045))
* **tests:** more windows-specific test fixes ([1c1a7eb](https://github.com/paambaati/codeclimate-action/commit/1c1a7eb012ea910fd8c81de6dedfdaff7ce7374e))
* **tests:** more windows-specific test fixes ([8d2edab](https://github.com/paambaati/codeclimate-action/commit/8d2edab83e08094146fcf395ff2f93f803ed50e5))
* **tests:** more windows-specific test fixes ([e05d58f](https://github.com/paambaati/codeclimate-action/commit/e05d58f36f359fd2e40e1378c64a6d5c5aa83e19))
* **tests:** more windows-specific tests ([e9e87cc](https://github.com/paambaati/codeclimate-action/commit/e9e87cc514c01b5a63d3f02552e7d1a137c803fc))
* **tests:** more windows-specific tests ([13ff2e3](https://github.com/paambaati/codeclimate-action/commit/13ff2e357d666a066f84e76369c20bb78b8f669b))
* **tests:** more windows-specific tests ([80aa61e](https://github.com/paambaati/codeclimate-action/commit/80aa61ef4dffb2558582006ee27683cf5d1d304e))
* **tests:** more windows-specific tests ([498dee1](https://github.com/paambaati/codeclimate-action/commit/498dee151bf552b61d78f1cf1b5345169cff761f))
* **tests:** more windows-specific tests ([f4dff2a](https://github.com/paambaati/codeclimate-action/commit/f4dff2a761bc3d7d08071c94d452704b5b07ff2d))
* **tests:** more windows-specific tests ([4b48851](https://github.com/paambaati/codeclimate-action/commit/4b488512dd11c86232802e7bfb81c02b9b89c6e3))
* **tests:** OS-agnostic line separators for all strings ([2fc4cc3](https://github.com/paambaati/codeclimate-action/commit/2fc4cc3403ce99cfe7000fe58b8d0acb89549fb7))
* **tests:** remove windows-only test and start writing os-independent logic ([29cbd91](https://github.com/paambaati/codeclimate-action/commit/29cbd9169661bae87eccb3ae15101e9d9fa58f1b))
* **tests:** run checksum verification pre-checks only for fixtures on their own target platforms ([4dc408b](https://github.com/paambaati/codeclimate-action/commit/4dc408bc02b974db9dc9e4129c7d797e7b0a3ee1))
* **tests:** set up correct file mode on Windows ([4edff7e](https://github.com/paambaati/codeclimate-action/commit/4edff7ebe0387ebfb113739a5ab3c9101994820e))
* **tests:** set up Windows fixtures ([c29289f](https://github.com/paambaati/codeclimate-action/commit/c29289fe7fac8870265111efaaeef59bb5b6a834))
* **tests:** skip integration tests on unsupported platforms ([00e5b40](https://github.com/paambaati/codeclimate-action/commit/00e5b40552ecfd62683dfc2202ed236538468d25))
* **tests:** try correcting extra spaces in checksum files generated on Windows ([edc5e97](https://github.com/paambaati/codeclimate-action/commit/edc5e97e04929ec51a7d6b02563e518d39aff823))
* try LF-only line endings for all files ([e2c94ee](https://github.com/paambaati/codeclimate-action/commit/e2c94ee03d92b6c92abd36933bea05650aac91c7))
* **util:** follow redirects in fetch ([a258bd9](https://github.com/paambaati/codeclimate-action/commit/a258bd9f1e258160b5309cfdfd7348aeb6edc640))


### core

* Support Windows ([9af890c](https://github.com/paambaati/codeclimate-action/commit/9af890ca201808293494389e160c2247062e61ab))
* Support Windows ([3434c61](https://github.com/paambaati/codeclimate-action/commit/3434c618e21bb9a4ea49f8f85e10839bef1addcd))


### Features

* **core:** Support Windows ([f0efca8](https://github.com/paambaati/codeclimate-action/commit/f0efca8d8bb2d28d2e31f5b09b3a12db580b74ed)), closes [#665](https://github.com/paambaati/codeclimate-action/issues/665)
* **core:** Support Windows ([9787ba6](https://github.com/paambaati/codeclimate-action/commit/9787ba65355cc7e2454726ff732df574e1a6b370))
* **utils:** refactor coverage config line parser into own util ([e03d453](https://github.com/paambaati/codeclimate-action/commit/e03d4534fcf95c549b4b083f76870551d74140c1))


### BREAKING CHANGES

* this should ideally get published as v5
* this should ideally get published as v5
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter – see codeclimate.com/changelog/7dd79ee1cf1af7141b2bd18b
* **core:** Support Windows, now that CodeClimate has released a Windows binary of the reporter

## [4.0.0](https://github.com/paambaati/codeclimate-action/compare/v3.1.0...v4.0.0) (2023-04-23)


### Bug Fixes

* **ci:** debug outputs ([11ed927](https://github.com/paambaati/codeclimate-action/commit/11ed9278d366c02ce89a0aa9c0266d01ed3fe78f))
* **ci:** fix invalid YAML ([8f95f43](https://github.com/paambaati/codeclimate-action/commit/8f95f43e97f705d9dbb7e18d5586a16e8531d318))
* **ci:** fix the tag detection logic for new releases ([f787a56](https://github.com/paambaati/codeclimate-action/commit/f787a56de16312cc3eeff8ed0117b9cc1339a2f3))
* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** republish so latest changes get applied ([8f00eaa](https://github.com/paambaati/codeclimate-action/commit/8f00eaacd9c46d0c7351c37ce64d6f2705ae93dc))
* **ci:** republish so latest changes get applied ([fa71c1f](https://github.com/paambaati/codeclimate-action/commit/fa71c1ff7a91f7177d648c64b50c50dd9aa0d90e))
* **ci:** set up correct (?) condition to trigger publish ([3e9c9ce](https://github.com/paambaati/codeclimate-action/commit/3e9c9cefc80813bd2d9fffeb4610778e0761f2f7))
* **ci:** try once again to publish new version ([bcd27f6](https://github.com/paambaati/codeclimate-action/commit/bcd27f6c52b0b9daa097cb34b05c43e5040216b7))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))
* **ci:** validate empty new release version ([2b9684a](https://github.com/paambaati/codeclimate-action/commit/2b9684a12a4089d77e5ab787677df4affaeb6ac0))
* **core:** support ARM 64-bit environments ([ea13673](https://github.com/paambaati/codeclimate-action/commit/ea1367348928eca3a302fb3682b07c585841c39f))
* **core:** support ARM 64-bit environments ([99e22b3](https://github.com/paambaati/codeclimate-action/commit/99e22b3d7de0c911c564cd391d4f9dae79ae176e))


### Features

* **core:** cleanup downloaded artifacts ([f331896](https://github.com/paambaati/codeclimate-action/commit/f3318964532e9a7bdf28c20830035973024c31bc)), closes [#639](https://github.com/paambaati/codeclimate-action/issues/639)
* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)


### BREAKING CHANGES

* **ci:** semantic-release and its process is fundamentally broken when the repo moved from master to main for its main branch. This is an attempt to try to unfuck the git log/ref notes

## [3.2.0](https://github.com/paambaati/codeclimate-action/compare/v3.1.0...v3.2.0) (2022-10-21)


### Bug Fixes

* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))
* **ci:** use the un-broken latest version of the workflow ([0fe0643](https://github.com/paambaati/codeclimate-action/commit/0fe06436de76fed68e37a8d6001f6ba46ba23f26))


### Features

* **core:** support fork PRs. ([70a75ac](https://github.com/paambaati/codeclimate-action/commit/70a75acf3c0eaae19bee5fb425f63e455356daf7)), closes [#627](https://github.com/paambaati/codeclimate-action/issues/627)

## [3.1.1](https://github.com/paambaati/codeclimate-action/compare/v3.1.0...v3.1.1) (2022-10-20)


### Bug Fixes

* **ci:** rebuild and republish to use new branch and workflows ([0c99fb3](https://github.com/paambaati/codeclimate-action/commit/0c99fb3d11aa2bbf8bf94ed90bd4955348c6338b))

## [3.1.0] - 2022-10-14
### Changed
- Updated base runtime version to Node.js 16.x - via [`#622`](https://github.com/paambaati/codeclimate-action/pull/622). This closes [`#621`](https://github.com/paambaati/codeclimate-action/issues/621). Thanks @fabn!

## [3.0.0] - 2021-09-30
### Added
- ✨ Verifies CC reporter binary after download - via [`#429`](https://github.com/paambaati/codeclimate-action/pull/429). This closes [`#331`](https://github.com/paambaati/codeclimate-action/issues/331).

### Fixed
- 🐛 Escape `action.yml` correctly so v3.x can be published - via [`#432`](https://github.com/paambaati/codeclimate-action/pull/432). This closes [`#430`](https://github.com/paambaati/codeclimate-action/issues/430). Thanks @antongolub!

## [2.7.5] - 2020-12-10
### Added
- ✨ Coverage prefix will now work for `after-build` commands as well - via [`#266`](https://github.com/paambaati/codeclimate-action/pull/266). This closes [`#265`](https://github.com/paambaati/codeclimate-action/issues/265). Thanks @matthewshirley!

## [2.7.4] - 2020-10-03
### Added
- 💫 Coverage locations can now be Glob patterns - via [`#240`](https://github.com/paambaati/codeclimate-action/pull/240). This closes [`#234`](https://github.com/paambaati/codeclimate-action/issues/234). Thanks @Sumolari!

## [2.7.3] - 2020-10-01
### Fixed
- 🐛 Default coverage command now correctly defaults to `''` - via [`#238`](https://github.com/paambaati/codeclimate-action/pull/238). This closes [`#235`](https://github.com/paambaati/codeclimate-action/issues/235). Thanks @bennypowers!

## [2.7.2] - 2020-10-01
### Fixed
- 🐛 The entrypoint logic was fixed so the script will _actually_ run now - via [`#236`](https://github.com/paambaati/codeclimate-action/pull/236). This closes [`#235`](https://github.com/paambaati/codeclimate-action/issues/235).

## [2.7.1] - 2020-09-22
### Added
- `coverageCommand` argument is now optional - via [`#220`](https://github.com/paambaati/codeclimate-action/pull/220). This closes [`#182`](https://github.com/paambaati/codeclimate-action/issues/182).

## [2.7.0] - 2020-09-22
### Added
- Customizable working directory with the new `workingDirectory` option - via [`#220`](https://github.com/paambaati/codeclimate-action/pull/220). Thanks @arareko!

### Fixed
- Errors in the `before-build` and `after-build` steps, if any, are now surfaced correctly - via [`#214`](https://github.com/paambaati/codeclimate-action/pull/214). Thanks @olly!

### Changed
- Dependencies upgraded to latest, including tape v5.

## [2.6.0] - 2020-04-24
### Fixed
- Fixed regressions introduced in [`#154`](https://github.com/paambaati/codeclimate-action/pull/154). Thanks @MartinNuc!

## [2.5.7] - 2020-04-17
### Fixed
- Finally fixed the long-standing [`#119`](https://github.com/paambaati/codeclimate-action/issues/119) with proper exit code handling - via [`#154`](https://github.com/paambaati/codeclimate-action/pull/154).

## [2.5.6] - 2020-03-28
### Fixed
- Correctly report `HEAD` SHA for PRs (and some nice refactors) - via [`#141`](https://github.com/paambaati/codeclimate-action/pull/141). Thanks @vladjerca!

## [2.5.5] - 2020-03-18
### Fixed
- `--prefix` fixes - via [`#131`](https://github.com/paambaati/codeclimate-action/pull/131). Thanks @rwjblue!

## [2.5.4] - 2020-03-04
### Fixed
- Fixes [#119](https://github.com/paambaati/codeclimate-action/issues/119) - via [`#127`](https://github.com/paambaati/codeclimate-action/pull/127).

## [2.5.3] - 2020-02-26
### Fixed
- Fixes [#109](https://github.com/paambaati/codeclimate-action/issues/109) and #117(https://github.com/paambaati/codeclimate-action/issues/117) - via [`#118`](https://github.com/paambaati/codeclimate-action/pull/118).

## [2.5.2] - 2020-02-26
### Changed
- [Better error message on failure of downloading CC Reporter](https://github.com/paambaati/codeclimate-action/issues/98) - via [`#116`](https://github.com/paambaati/codeclimate-action/pull/116).

## [2.5.1] - 2020-02-26
### Fixed
- Fix reporting the [wrong branch name for PRs](https://github.com/paambaati/codeclimate-action/issues/86) - via [`#115`](https://github.com/paambaati/codeclimate-action/pull/115).

## [2.5.0] - 2020-02-25
### Added
- Custom `--prefix` support - via [`#111`](https://github.com/paambaati/codeclimate-action/pull/111).

## [2.4.0] - 2020-01-07
### Added
- Multiple coverage locations support - via [`#77`](https://github.com/paambaati/codeclimate-action/pull/77). Thanks @mattvv!

## [2.3.0] - 2019-10-31
### Added
- Debug support - via [`#45`](https://github.com/paambaati/codeclimate-action/pull/45).

## [2.2.6] - 2019-10-31
### Fixed
- `env` issues introduced after the Husky-related fixes.

## [2.2.5] - 2019-10-29
### Fixed
- Remove `husky` as a dependency.

### Changed
- Automated releases thanks to [`technote-space/release-github-actions`](https://github.com/technote-space/release-github-actions).

## [2.2.4] - 2019-10-27
### Fixed
- Fix [missing files](https://github.com/paambaati/codeclimate-action/issues/42#issuecomment-546676537).

## [2.2.3] - 2019-10-27
### Fixed
- Fix [runtime failures](https://github.com/paambaati/codeclimate-action/issues/42#issuecomment-546659123) - via [`0a0ba88`](https://github.com/paambaati/codeclimate-action/commit/0a0ba88ef1092c69d5be6235dc6d493a699ffb1a) and [`c2422ad`](https://github.com/paambaati/codeclimate-action/commit/c2422ad00a34ed3524226d5d1e2124e05a970874).

## [2.2.2] - 2019-10-27
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
