interface WasmModule {
  ccall: (
    funcName: string,
    returnType: string,
    argTypes: string[],
    args: unknown[]
  ) => void;
  cwrap: (
    funcName: string,
    returnType: string,
    argTypes: string[]
  ) => (...args: unknown[]) => void;
  _malloc: (size: number) => number;
  _free: (ptr: number) => void;
  HEAP32: Int32Array;
  HEAPF64: Float64Array;
}

let wasmModule: WasmModule | null = null;
let wasmLoading: Promise<WasmModule> | null = null;

export async function loadWasmModule(): Promise<WasmModule> {
  if (wasmModule) {
    return wasmModule;
  }

  if (wasmLoading) {
    return wasmLoading;
  }

  wasmLoading = (async () => {
    try {
      if (typeof window === "undefined") {
        throw new Error("WASM can only be loaded in browser");
      }

      const wasmJsUrl = "/wasm/algorithms.js";
      
      const script = document.createElement("script");
      script.src = wasmJsUrl;
      document.head.appendChild(script);
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load WASM script"));
        setTimeout(() => reject(new Error("WASM script load timeout")), 10000);
      });
      
      const globalWindow = window as unknown as { createWasmModule?: () => Promise<WasmModule> };
      const createWasmModule = globalWindow.createWasmModule;
      if (!createWasmModule) {
        throw new Error("createWasmModule not found. Make sure algorithms.js is loaded correctly.");
      }
      
      const wasmInstance = await createWasmModule();
      wasmModule = wasmInstance as WasmModule;
      return wasmModule;
    } catch (error) {
      console.error("Failed to load WASM module:", error);
      throw error;
    }
  })();

  return wasmLoading;
}

export function dijkstraWasm(
  n: number,
  src: number,
  matrix: number[][]
): number[] {
  if (!wasmModule) {
    throw new Error("WASM module not loaded");
  }

  const flatMatrix = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      flatMatrix[i * n + j] = matrix[i][j] || 0;
    }
  }

  const matrixPtr = wasmModule._malloc(flatMatrix.length * 8);
  const resultPtr = wasmModule._malloc(n * 8);

  try {
    wasmModule.HEAPF64.set(flatMatrix, matrixPtr / 8);

    wasmModule.ccall(
      "dijkstra_wasm",
      "null",
      ["number", "number", "number", "number"],
      [n, src + 1, matrixPtr, resultPtr]
    );

    const result = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = wasmModule.HEAPF64[resultPtr / 8 + i];
    }

    return result;
  } finally {
    wasmModule._free(matrixPtr);
    wasmModule._free(resultPtr);
  }
}

export function bellmanFordWasm(
  n: number,
  src: number,
  edges: Array<{ u: number; v: number; w: number }>
): number[] {
  if (!wasmModule) {
    throw new Error("WASM module not loaded");
  }

  const edgeCount = edges.length;
  const edgesU = new Int32Array(edgeCount);
  const edgesV = new Int32Array(edgeCount);
  const edgesW = new Float64Array(edgeCount);

  edges.forEach((edge, i) => {
    edgesU[i] = edge.u + 1;
    edgesV[i] = edge.v + 1;
    edgesW[i] = edge.w;
  });

  const edgesUPtr = wasmModule._malloc(edgeCount * 4);
  const edgesVPtr = wasmModule._malloc(edgeCount * 4);
  const edgesWPtr = wasmModule._malloc(edgeCount * 8);
  const resultPtr = wasmModule._malloc(n * 8);

  try {
    wasmModule.HEAP32.set(edgesU, edgesUPtr / 4);
    wasmModule.HEAP32.set(edgesV, edgesVPtr / 4);
    wasmModule.HEAPF64.set(edgesW, edgesWPtr / 8);

    wasmModule.ccall(
      "bellman_ford_wasm",
      "null",
      ["number", "number", "number", "number", "number", "number", "number"],
      [n, src + 1, edgeCount, edgesUPtr, edgesVPtr, edgesWPtr, resultPtr]
    );

    const result = new Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = wasmModule.HEAPF64[resultPtr / 8 + i];
    }

    return result;
  } finally {
    wasmModule._free(edgesUPtr);
    wasmModule._free(edgesVPtr);
    wasmModule._free(edgesWPtr);
    wasmModule._free(resultPtr);
  }
}

