CC = emcc

FAST_CFLAGS = -O0 -s WASM=1 -s EXPORTED_FUNCTIONS='["_dijkstra_wasm", "_bellman_ford_wasm", "_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_NAME="createWasmModule" --no-entry -g

PROD_CFLAGS = -O3 -s WASM=1 -s EXPORTED_FUNCTIONS='["_dijkstra_wasm", "_bellman_ford_wasm", "_malloc", "_free"]' -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "UTF8ToString", "stringToUTF8"]' -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s EXPORT_NAME="createWasmModule" --no-entry

all: algorithms.wasm algorithms.js

fast: algorithms.cpp
	@echo "Building WASM (fast mode - no optimization)..."
	$(CC) $(FAST_CFLAGS) algorithms.cpp -o algorithms.js
	@echo "Build complete!"

algorithms.wasm algorithms.js: algorithms.cpp
	@echo "Building WASM (production mode - optimized)..."
	$(CC) $(PROD_CFLAGS) algorithms.cpp -o algorithms.js
	@echo "Build complete!"

clean:
	rm -f algorithms.wasm algorithms.js

.PHONY: all fast clean

