#include <emscripten.h>
#include <vector>
#include <iostream>
#include <algorithm>
#include <climits>
using namespace std;

const long long INF = 1e18;

struct Edge {
    int u, v;
    long long w;
};

extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void dijkstra_wasm(int n, int src, long long* matrix, long long* result) {
        vector<vector<long long>> mat(n + 1, vector<long long>(n + 1));
        
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= n; j++) {
                mat[i][j] = matrix[(i - 1) * n + (j - 1)];
                if (i == j) mat[i][j] = 0;
            }
        }
        
        vector<long long> dist(n + 1, INF);
        vector<bool> used(n + 1, false);
        dist[src] = 0;
        
        for (int i = 1; i <= n; i++) {
            int u = -1;
            long long best = INF;
            for (int v = 1; v <= n; v++)
                if (!used[v] && dist[v] < best)
                    best = dist[v], u = v;
            
            if (u == -1) break;
            used[u] = true;
            
            for (int v = 1; v <= n; v++)
                if (mat[u][v] < INF && dist[u] + mat[u][v] < dist[v])
                    dist[v] = dist[u] + mat[u][v];
        }
        
        for (int i = 1; i <= n; i++) {
            result[i - 1] = dist[i];
        }
    }
    
    EMSCRIPTEN_KEEPALIVE
    void bellman_ford_wasm(int n, int src, int edgeCount, int* edges_u, int* edges_v, long long* edges_w, long long* result) {
        vector<long long> dist(n + 1, INF);
        dist[src] = 0;
        
        vector<Edge> edges;
        for (int i = 0; i < edgeCount; i++) {
            edges.push_back({edges_u[i], edges_v[i], edges_w[i]});
        }
        
        for (int i = 1; i <= n - 1; i++) {
            for (auto &e : edges)
                if (dist[e.u] < INF && dist[e.u] + e.w < dist[e.v])
                    dist[e.v] = dist[e.u] + e.w;
        }
        
        for (int i = 1; i <= n; i++) {
            result[i - 1] = dist[i];
        }
    }
}