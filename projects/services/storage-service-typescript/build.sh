#!/bin/bash -e

yarn link orbs-common-library
yarn link orbs-block-storage-library
yarn link orbs-state-storage-library

yarn install

yarn run build
