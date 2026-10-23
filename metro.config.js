const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// The backend is a separate project that may sit next to (or inside) this folder on a developer's
// machine. The app never imports from it, so Metro must not crawl or bundle it (its node_modules is huge).
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const backendFolder = new RegExp(`^${escapeRegExp(path.resolve(__dirname, 'mysawari_customer_backend'))}[\\\\/].*`);
// Expo's default blockList is an array of patterns; keep them and add ours.
config.resolver.blockList = [].concat(config.resolver.blockList || [], backendFolder);

module.exports = config;
