const fs = require("fs");
const path = require("path");

const wasmDir = path.join(__dirname, "..", "wasm");
const publicWasmDir = path.join(__dirname, "..", "public", "wasm");

if (!fs.existsSync(publicWasmDir)) {
  fs.mkdirSync(publicWasmDir, { recursive: true });
}

const filesToCopy = ["algorithms.js", "algorithms.wasm"];

filesToCopy.forEach((file) => {
  const src = path.join(wasmDir, file);
  const dest = path.join(publicWasmDir, file);
  
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to public/wasm/`);
  } else {
    console.warn(`Warning: ${file} not found in wasm directory`);
  }
});

