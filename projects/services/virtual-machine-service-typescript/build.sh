#!/bin/bash -e

yarn link orbs-common-library
yarn link orbs-virtual-machine-library

yarn install

yarn run build

yarn link
