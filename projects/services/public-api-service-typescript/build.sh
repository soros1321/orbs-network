#!/bin/bash -e

yarn link orbs-common-library
yarn link orbs-public-api-library

yarn install

yarn run build
