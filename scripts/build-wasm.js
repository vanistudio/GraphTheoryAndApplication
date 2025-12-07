const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

const wasmDir = path.join(__dirname, "..", "wasm");
const publicWasmDir = path.join(__dirname, "..", "public", "wasm");
const algorithmsCpp = path.join(wasmDir, "algorithms.cpp");
const outputJs = path.join(wasmDir, "algorithms.js");

const mode = process.argv[2] || "fast"; // "fast" or "prod"

if (!fs.existsSync(algorithmsCpp)) {
  console.error("Error: algorithms.cpp not found!");
  process.exit(1);
}

function findEmcc() {
  try {
    execSync("emcc --version", { stdio: "ignore" });
    return "emcc";
  } catch (e) {
    const homeDir = os.homedir();
    const possiblePaths = [
      path.join(homeDir, "emsdk", "upstream", "emscripten", "emcc"),
      path.join(homeDir, "emsdk", "upstream", "emscripten", "emcc.bat"),
      path.join(process.cwd(), "emsdk", "upstream", "emscripten", "emcc"),
      path.join(process.cwd(), "emsdk", "upstream", "emscripten", "emcc.bat"),
      "C:\\emsdk\\upstream\\emscripten\\emcc.bat",
      "C:\\emsdk\\upstream\\emscripten\\emcc",
    ];
    
    for (const emccPath of possiblePaths) {
      if (fs.existsSync(emccPath)) {
        console.log(`Found emcc at: ${emccPath}`);
        return emccPath;
      }
    }
    
    return null;
  }
}

const emcc = findEmcc();

if (!emcc) {
  console.error("\n❌ Error: emcc (Emscripten) not found!");
  console.error("\n📦 Please install Emscripten:");
  console.error("\n   Option 1: Install via emsdk (Recommended)");
  console.error("   git clone https://github.com/emscripten-core/emsdk.git");
  console.error("   cd emsdk");
  console.error("   emsdk.bat install latest");
  console.error("   emsdk.bat activate latest");
  console.error("   emsdk_env.bat");
  console.error("\n   Option 2: Add emcc to your PATH");
  console.error("   After installing emsdk, add it to your system PATH");
  console.error("\n   Then run this script again.\n");
  process.exit(1);
}

console.log(`Building WASM in ${mode} mode...`);

const fastFlags = [
  "-O0",
  "-s", "WASM=1",
  "-s", 'EXPORTED_FUNCTIONS=["_dijkstra_wasm", "_bellman_ford_wasm", "_malloc", "_free"]',
  "-s", 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap"]',
  "-s", "ALLOW_MEMORY_GROWTH=1",
  "-s", "MODULARIZE=1",
  "-s", 'EXPORT_NAME="createWasmModule"',
  "--no-entry",
  "-g",
  algorithmsCpp,
  "-o", outputJs
];

const prodFlags = [
  "-O3",
  "-s", "WASM=1",
  "-s", 'EXPORTED_FUNCTIONS=["_dijkstra_wasm", "_bellman_ford_wasm", "_malloc", "_free"]',
  "-s", 'EXPORTED_RUNTIME_METHODS=["ccall", "cwrap", "UTF8ToString", "stringToUTF8"]',
  "-s", "ALLOW_MEMORY_GROWTH=1",
  "-s", "MODULARIZE=1",
  "-s", 'EXPORT_NAME="createWasmModule"',
  "--no-entry",
  algorithmsCpp,
  "-o", outputJs
];

const flags = mode === "fast" ? fastFlags : prodFlags;

try {
  console.log("Running emcc...");
  const isWindows = process.platform === "win32";
  
  const command = isWindows && emcc.endsWith(".bat")
    ? `"${emcc}" ${flags.map(f => f.includes(" ") ? `"${f}"` : f).join(" ")}`
    : `${emcc} ${flags.map(f => f.includes(" ") ? `"${f}"` : f).join(" ")}`;
  
  execSync(command, {
    cwd: wasmDir,
    stdio: "inherit",
    shell: isWindows,
    env: { ...process.env },
  });
  
  console.log("Build complete! Copying files to public/wasm/...");
  
  if (!fs.existsSync(publicWasmDir)) {
    fs.mkdirSync(publicWasmDir, { recursive: true });
  }
  
  const filesToCopy = ["algorithms.js", "algorithms.wasm"];
  
  filesToCopy.forEach((file) => {
    const src = path.join(wasmDir, file);
    const dest = path.join(publicWasmDir, file);
    
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`✓ Copied ${file} to public/wasm/`);
    } else {
      console.warn(`⚠ Warning: ${file} not found`);
    }
  });
  
  console.log("Done!");
} catch (error) {
  console.error("Build failed:", error.message);
  process.exit(1);
}

