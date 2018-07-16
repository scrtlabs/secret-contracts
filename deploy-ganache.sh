#!/usr/bin/env bash
rm -rf build
truffle compile
truffle migrate --reset --network $1


