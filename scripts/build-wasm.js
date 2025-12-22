const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const mode = process.argv[2] || "fast";

const wasmDir = path.join(__dirname, "..", "wasm");
const publicWasmDir = path.join(__dirname, "..", "public", "wasm");

// Find emcc
function findEmcc() {
  const possiblePaths = [
    process.env.EMSDK,
    path.join(process.env.HOME || process.env.USERPROFILE, "emsdk"),
    path.join(process.env.HOME || process.env.USERPROFILE, ".emsdk"),
    "C:\\emsdk",
    "/usr/local/emsdk",
    "/opt/emsdk",
  ];

  for (const basePath of possiblePaths) {
    if (!basePath) continue;
    
    const emccPaths = [
      path.join(basePath, "upstream", "emscripten", "emcc"),
      path.join(basePath, "upstream", "emscripten", "emcc.bat"),
      path.join(basePath, "emscripten", "emcc"),
      path.join(basePath, "emscripten", "emcc.bat"),
    ];

    for (const emccPath of emccPaths) {
      if (fs.existsSync(emccPath)) {
        return emccPath;
      }
    }
  }

  // Try to find in PATH
  try {
    execSync("emcc --version", { stdio: "ignore" });
    return "emcc";
  } catch {
    return null;
  }
}

const emcc = findEmcc();

if (!emcc) {
  console.error("Error: emcc not found!");
  console.error("Please install Emscripten SDK and make sure emcc is in your PATH.");
  console.error("Or set EMSDK environment variable to your Emscripten SDK path.");
  process.exit(1);
}

// Escape quotes for Windows shell
function escapeForShell(str) {
  if (process.platform === "win32") {
    return str.replace(/"/g, '\\"');
  }
  return str;
}

const fastFlags = [
  "-O0",
  "-s", "WASM=1",
  "-s", escapeForShell('EXPORTED_FUNCTIONS=["_has_negative_weight_wasm", "_dijkstra_wasm", "_bellman_ford_wasm", "_kruskal_wasm", "_prim_wasm", "_malloc", "_free"]'),
  "-s", escapeForShell('EXPORTED_RUNTIME_METHODS=["ccall", "cwrap", "HEAP32", "HEAPF64"]'),
  "-s", "ALLOW_MEMORY_GROWTH=1",
  "-s", "MODULARIZE=1",
  "-s", escapeForShell('EXPORT_NAME="createWasmModule"'),
  "--no-entry",
  "-g"
];

const prodFlags = [
  "-O3",
  "-s", "WASM=1",
  "-s", escapeForShell('EXPORTED_FUNCTIONS=["_has_negative_weight_wasm", "_dijkstra_wasm", "_bellman_ford_wasm", "_kruskal_wasm", "_prim_wasm", "_malloc", "_free"]'),
  "-s", escapeForShell('EXPORTED_RUNTIME_METHODS=["ccall", "cwrap", "UTF8ToString", "stringToUTF8", "HEAP32", "HEAPF64"]'),
  "-s", "ALLOW_MEMORY_GROWTH=1",
  "-s", "MODULARIZE=1",
  "-s", escapeForShell('EXPORT_NAME="createWasmModule"'),
  "--no-entry"
];

const flags = mode === "fast" ? fastFlags : prodFlags;
const modeName = mode === "fast" ? "fast (no optimization)" : "production (optimized)";

console.log(`Building WASM in ${modeName} mode...`);
console.log(`Using emcc: ${emcc}`);

try {
  const cppFile = path.join(wasmDir, "algorithms.cpp");
  const outputFile = path.join(wasmDir, "algorithms.js");
  
  // Build command string with proper quoting for Windows
  const commandParts = [emcc, ...flags.map(f => `"${f}"`), `"${cppFile}"`, "-o", `"${outputFile}"`];
  const command = commandParts.join(" ");
  
  console.log("Running emcc...");
  execSync(command, { stdio: "inherit", cwd: wasmDir, shell: true });
  
  // Copy files to public/wasm
  if (!fs.existsSync(publicWasmDir)) {
    fs.mkdirSync(publicWasmDir, { recursive: true });
  }
  
  const wasmFile = path.join(wasmDir, "algorithms.wasm");
  if (fs.existsSync(wasmFile)) {
    fs.copyFileSync(wasmFile, path.join(publicWasmDir, "algorithms.wasm"));
    console.log("Copied algorithms.wasm to public/wasm/");
  }
  
  if (fs.existsSync(outputFile)) {
    fs.copyFileSync(outputFile, path.join(publicWasmDir, "algorithms.js"));
    console.log("Copied algorithms.js to public/wasm/");
  }
  
  console.log("Build complete!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}

