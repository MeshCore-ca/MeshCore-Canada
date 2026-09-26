#!/usr/bin/env node
// Public entry point: the active model is MeshMapper IATA scopes.
import("./validate-iata-scopes.mjs").catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
