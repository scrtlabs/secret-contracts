# js-linguist

[![Build Status](https://travis-ci.org/RichardLitt/js-linguist.svg?branch=master)](https://travis-ci.org/RichardLitt/js-linguist)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg?style=flat-square)](https://github.com/RichardLitt/standard-readme)

> Get GitHub Linguist data for a repository

This is a wrapper around GitHub's [linguist](https://github.com/github/linguist). That will need to be installed for this to work.

## Install

```
$ npm install --save js-linguist
```

## Usage

```js
const jsLinguist = require('js-linguist');

jsLinguist();
//=> {JavaScript: '100'}
```

### Options

#### s, stdout

Print the response from `linguist` directly, instead of as a JSON object.

## CLI

```
$ npm install --global js-linguist
```

```
$ js-linguist --help

  Usage
    $ linguist

  Options
    --stdout, -s  Print normal result to stdout instead of json. [Default: false]

  Examples
    $ linguist
    {JavaScript: 100}
    $ linguist -s
    100% JavaScript
```

## Contribute

PRs accepted. Check out the [issues](https://github.com/RichardLitt/js-linguist/issues)!

## License

[MIT](license) © 2016 [Richard Littauer](http://burntfen.com)
