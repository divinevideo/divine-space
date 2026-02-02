// ABOUTME: Publishing configuration for divine-space on Fastly Compute
// ABOUTME: Configures how content is published to KV store

/** @type {import('@fastly/compute-js-static-publish').PublishContentConfig} */
const config = {
  rootDir: "../dist",
  staticPublisherWorkingDir: "./static-publisher",
  kvStoreName: "divine-space-content",
  publishId: "default",
  defaultCollectionName: "live",
  excludeDirs: [
    './node_modules',
  ],
  excludeDotFiles: true,
  includeWellKnown: true,
  contentCompression: ['br', 'gzip'],

  kvStoreAssetInclusionTest: (assetKey) => {
    return true;
  },

  server: {
    publicDirPrefix: "",
    staticItems: ["/assets/"],
    allowedEncodings: ['br', 'gzip'],
    spaFile: "/index.html",
    notFoundPageFile: "/404.html",
    autoExt: [],
    autoIndex: ["index.html", "index.htm"],
  },
};

export default config;
