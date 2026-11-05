// Vercel serverless function entry point.
// The Express app is pre-bundled by esbuild (see artifacts/api-server/build.mjs).
// All workspace packages and dependencies are inlined into vercel.cjs.
const mod = require("../artifacts/api-server/dist/vercel.cjs");
module.exports = mod.default || mod;
