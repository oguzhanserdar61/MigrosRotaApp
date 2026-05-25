const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaultResolveRequest = config.resolver.resolveRequest;
const zustandRoot = path.dirname(require.resolve('zustand/package.json'));

const zustandCjsEntries = {
  zustand: 'index.js',
  'zustand/vanilla': 'vanilla.js',
  'zustand/middleware': 'middleware.js',
  'zustand/shallow': 'shallow.js',
  'zustand/traditional': 'traditional.js',
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const zustandEntry = zustandCjsEntries[moduleName];
  if (platform === 'web' && zustandEntry) {
    return {
      type: 'sourceFile',
      filePath: path.join(zustandRoot, zustandEntry),
    };
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
