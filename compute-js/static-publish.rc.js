// ABOUTME: Static publish runtime configuration for divine-space
// ABOUTME: Used by @fastly/compute-js-static-publish server

/** @type {import('@fastly/compute-js-static-publish').StaticPublisherConfig} */
const config = {
  rootDir: '../dist',
  kvStoreName: 'divine-space-content',
  publishId: 'default',
  staticPublisherWorkingDir: './static-publisher',
  excludeDirs: [],
  excludeDotFiles: true,
  includeWellKnown: true,
  contentAssetInclusionTest: (path) => true,
  contentTypes: [],
  moduleAssetInclusionTest: (path) => false,
  spa: '/index.html',
  notFoundPage: '/404.html',
  autoIndex: ['index.html'],
  autoExt: [],
};

export default config;
