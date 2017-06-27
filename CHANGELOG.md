# Change Log

## [Unreleased](https://github.com/senecajs/seneca-amqp-transport/tree/HEAD)

[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/2.1.0...HEAD)

**Implemented enhancements:**

- Add functional tests using rabbitmq services on CI [\#74](https://github.com/senecajs/seneca-amqp-transport/issues/74)
- Update tests to use Sinon ^2.0.0 [\#85](https://github.com/senecajs/seneca-amqp-transport/pull/85) ([nfantone](https://github.com/nfantone))
- \[WIP\] Refactor classes -\> factory functions [\#73](https://github.com/senecajs/seneca-amqp-transport/pull/73) ([nfantone](https://github.com/nfantone))

**Fixed bugs:**

- incompatible version of `amqpuri` [\#90](https://github.com/senecajs/seneca-amqp-transport/issues/90)
- AMQP Listener Doesn't Work With dot values in the pin \(e.g. role:twitter,version:v1.0,cmd:tweets,method:GET\) [\#66](https://github.com/senecajs/seneca-amqp-transport/issues/66)

**Closed issues:**

- AMQPS Support [\#77](https://github.com/senecajs/seneca-amqp-transport/issues/77)

**Merged pull requests:**

- Update sinon-test to the latest version 🚀 [\#95](https://github.com/senecajs/seneca-amqp-transport/pull/95) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update eslint to the latest version 🚀 [\#94](https://github.com/senecajs/seneca-amqp-transport/pull/94) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update dependencies to enable Greenkeeper 🌴 [\#92](https://github.com/senecajs/seneca-amqp-transport/pull/92) ([greenkeeper[bot]](https://github.com/apps/greenkeeper))
- Update jsonic to version 0.3.0 🚀 [\#89](https://github.com/senecajs/seneca-amqp-transport/pull/89) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update sinon to version 2.0.0 🚀 [\#80](https://github.com/senecajs/seneca-amqp-transport/pull/80) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update gulp-mocha to version 4.0.0 🚀 [\#79](https://github.com/senecajs/seneca-amqp-transport/pull/79) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update uuid to version 3.0.1 🚀 [\#72](https://github.com/senecajs/seneca-amqp-transport/pull/72) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update amqplib to version 0.5.0 🚀 [\#68](https://github.com/senecajs/seneca-amqp-transport/pull/68) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Fixes literal periods in a pin not publishing/listening properly [\#67](https://github.com/senecajs/seneca-amqp-transport/pull/67) ([ericnograles](https://github.com/ericnograles))

## [2.1.0](https://github.com/senecajs/seneca-amqp-transport/tree/2.1.0) (2016-10-16)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/2.0.0...2.1.0)

**Implemented enhancements:**

- Support dead lettering of messages [\#59](https://github.com/senecajs/seneca-amqp-transport/issues/59)
- Support for dead-lettering failed messages [\#61](https://github.com/senecajs/seneca-amqp-transport/pull/61) ([nfantone](https://github.com/nfantone))

**Fixed bugs:**

- Support numbers and booleans on queue name generation [\#62](https://github.com/senecajs/seneca-amqp-transport/pull/62) ([nfantone](https://github.com/nfantone))

## [2.0.0](https://github.com/senecajs/seneca-amqp-transport/tree/2.0.0) (2016-10-12)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/1.1.1...2.0.0)

**Merged pull requests:**

- Set channel prefetch count [\#57](https://github.com/senecajs/seneca-amqp-transport/pull/57) ([nfantone](https://github.com/nfantone))

## [1.1.1](https://github.com/senecajs/seneca-amqp-transport/tree/1.1.1) (2016-10-11)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/1.1.0...1.1.1)

**Closed issues:**

- Becoming the official plugin [\#6](https://github.com/senecajs/seneca-amqp-transport/issues/6)

## [1.1.0](https://github.com/senecajs/seneca-amqp-transport/tree/1.1.0) (2016-10-11)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/1.0.1...1.1.0)

**Implemented enhancements:**

- Add correlationId on RPC messages [\#56](https://github.com/senecajs/seneca-amqp-transport/pull/56) ([nfantone](https://github.com/nfantone))

**Merged pull requests:**

- Update eslint-config-xo-space to version 0.15.0 🚀 [\#55](https://github.com/senecajs/seneca-amqp-transport/pull/55) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- seneca@3.2.1 breaks build 🚨 [\#54](https://github.com/senecajs/seneca-amqp-transport/pull/54) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- chore\(package\): update seneca to version 3.2.1 [\#52](https://github.com/senecajs/seneca-amqp-transport/pull/52) ([nfantone](https://github.com/nfantone))
- Update seneca to version 3.0.0 🚀 [\#46](https://github.com/senecajs/seneca-amqp-transport/pull/46) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [1.0.1](https://github.com/senecajs/seneca-amqp-transport/tree/1.0.1) (2016-08-24)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/1.0.0...1.0.1)

**Fixed bugs:**

- Correct bad plugin options usage [\#45](https://github.com/senecajs/seneca-amqp-transport/pull/45) ([nfantone](https://github.com/nfantone))

**Merged pull requests:**

- Update eslint-config-seneca to version 3.0.0 🚀 [\#43](https://github.com/senecajs/seneca-amqp-transport/pull/43) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update gulp-mocha to version 3.0.0 🚀 [\#42](https://github.com/senecajs/seneca-amqp-transport/pull/42) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Update eslint-plugin-standard to version 2.0.0 🚀 [\#40](https://github.com/senecajs/seneca-amqp-transport/pull/40) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))

## [1.0.0](https://github.com/senecajs/seneca-amqp-transport/tree/1.0.0) (2016-07-05)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/0.2.2...1.0.0)

**Implemented enhancements:**

- Unit tests and coverage [\#31](https://github.com/senecajs/seneca-amqp-transport/issues/31)
- Mocha unit tests - utilities and default options schema check [\#34](https://github.com/senecajs/seneca-amqp-transport/pull/34) ([spilio](https://github.com/spilio))
- ES6/2015 classes [\#30](https://github.com/senecajs/seneca-amqp-transport/pull/30) ([nfantone](https://github.com/nfantone))

**Merged pull requests:**

- Update gulp-istanbul to version 1.0.0 🚀 [\#35](https://github.com/senecajs/seneca-amqp-transport/pull/35) ([greenkeeperio-bot](https://github.com/greenkeeperio-bot))
- Fixed typo in README.md - missing ',' in JSON configuration object [\#26](https://github.com/senecajs/seneca-amqp-transport/pull/26) ([spilio](https://github.com/spilio))
- Add Travis CI support [\#25](https://github.com/senecajs/seneca-amqp-transport/pull/25) ([nfantone](https://github.com/nfantone))
- fix to the readme examples [\#24](https://github.com/senecajs/seneca-amqp-transport/pull/24) ([mitchellparsons](https://github.com/mitchellparsons))

## [0.2.2](https://github.com/senecajs/seneca-amqp-transport/tree/0.2.2) (2016-04-25)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/0.2.1...0.2.2)

**Fixed bugs:**

- Typo in the npm module uri parsing code [\#20](https://github.com/senecajs/seneca-amqp-transport/issues/20)

## [0.2.1](https://github.com/senecajs/seneca-amqp-transport/tree/0.2.1) (2016-04-22)
[Full Changelog](https://github.com/senecajs/seneca-amqp-transport/compare/0.2.0...0.2.1)

**Implemented enhancements:**

- Fire & forget mode – publish message without waiting for response [\#17](https://github.com/senecajs/seneca-amqp-transport/issues/17)

**Fixed bugs:**

- Force reply queue names to be random always [\#19](https://github.com/senecajs/seneca-amqp-transport/pull/19) ([nfantone](https://github.com/nfantone))

## [0.2.0](https://github.com/senecajs/seneca-amqp-transport/tree/0.2.0) (2016-02-16)
**Implemented enhancements:**

- Gulp addition [\#13](https://github.com/senecajs/seneca-amqp-transport/pull/13) ([nfantone](https://github.com/nfantone))
- Support for multiple pins [\#15](https://github.com/senecajs/seneca-amqp-transport/pull/15) ([nfantone](https://github.com/nfantone))

**Fixed bugs:**

- Mismatched queue names are used when pin values have more than one key-value pair [\#11](https://github.com/senecajs/seneca-amqp-transport/issues/11)

**Closed issues:**

- Document proper usage and API [\#4](https://github.com/senecajs/seneca-amqp-transport/issues/4)

**Merged pull requests:**

- Plugin overhaul [\#5](https://github.com/senecajs/seneca-amqp-transport/pull/5) ([nfantone](https://github.com/nfantone))
- fix extend options bug [\#1](https://github.com/senecajs/seneca-amqp-transport/pull/1) ([idoshamun](https://github.com/idoshamun))
- New release [\#10](https://github.com/senecajs/seneca-amqp-transport/pull/10) ([nfantone](https://github.com/nfantone))



\* *This Change Log was automatically generated by [github_changelog_generator](https://github.com/skywinder/Github-Changelog-Generator)*