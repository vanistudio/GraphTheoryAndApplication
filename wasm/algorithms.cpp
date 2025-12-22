#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

const long long INF = 1e18;

struct Edge {
    int u, v;
    long long w;
};

/* CHECK AM */
bool hasNegativeWeight(int n, vector<vector<long long>> &mat) {
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
            if (i != j && mat[i][j] < 0 && mat[i][j] < INF)
                return true;
    return false;
}

/* DIJKSTRA */
void dijkstra(int n, int src, vector<vector<long long>> &mat) {
    vector<long long> dist(n + 1, INF);
    vector<bool> visited(n + 1, false);

    int current = src;
    dist[src] = 0;

    for (int step = 1; step <= n; step++) {
        visited[current] = true;

        for (int v = 1; v <= n; v++) {
            if (!visited[v] && mat[current][v] < INF) {
                if (dist[current] + mat[current][v] < dist[v]) {
                    dist[v] = dist[current] + mat[current][v];
                }
            }
        }

        long long best = INF;
        int next = -1;
        for (int v = 1; v <= n; v++) {
            if (!visited[v] && dist[v] < best) {
                best = dist[v];
                next = v;
            }
        }

        if (next == -1) break;
        current = next;
    }

    for (int i = 1; i <= n; i++) {
        if (dist[i] == INF) cout << "INF ";
        else cout << dist[i] << " ";
    }
    cout << endl;
}

/* BELLMAN FORD */
void bellman_ford(int n, int src, vector<Edge> &edges) {
    vector<long long> dist(n+1, INF);
    dist[src] = 0;

    for (int i = 1; i <= n - 1; i++)
        for (auto &e : edges)
            if (dist[e.u] < INF && dist[e.u] + e.w < dist[e.v])
                dist[e.v] = dist[e.u] + e.w;

    for (int i = 1; i <= n; i++) {
        if (dist[i] == INF) cout << "INF ";
        else cout << dist[i] << " ";
    }
    cout << endl;
}

/* KRUSKAL */
int parent[1005];

int find_set(int u) {
    if (u == parent[u]) return u;
    return parent[u] = find_set(parent[u]);
}

bool union_set(int u, int v) {
    u = find_set(u);
    v = find_set(v);
    if (u == v) return false;
    parent[v] = u;
    return true;
}

long long kruskal(int n, vector<Edge> edges) {
    for (int i = 1; i <= n; i++) parent[i] = i;

    sort(edges.begin(), edges.end(),
         [](Edge a, Edge b) { return a.w < b.w; });

    long long mst = 0;
    int cnt = 0;

    for (auto &e : edges) {
        if (union_set(e.u, e.v)) {
            mst += e.w;
            cnt++;
            if (cnt == n - 1) break;
        }
    }

    if (cnt != n - 1) return -1;
    return mst;
}

/* PRIM */
long long prim(int n, vector<vector<long long>> &mat) {
    vector<long long> minEdge(n+1, INF);
    vector<bool> used(n+1, false);

    minEdge[1] = 0;
    long long mst = 0;

    for (int i = 1; i <= n; i++) {
        int u = -1;
        for (int v = 1; v <= n; v++)
            if (!used[v] && (u == -1 || minEdge[v] < minEdge[u]))
                u = v;

        if (minEdge[u] == INF) return -1;

        used[u] = true;
        mst += minEdge[u];

        for (int v = 1; v <= n; v++)
            if (!used[v] && mat[u][v] < minEdge[v])
                minEdge[v] = mat[u][v];
    }
    return mst;
}

/* WRAPPER FUNCTIONS FOR WASM */

extern "C" {
    int has_negative_weight_wasm(int n, double* mat) {
        vector<vector<long long>> matrix(n+1, vector<long long>(n+1, INF));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matrix[i+1][j+1] = (long long)mat[i * n + j];
            }
        }
        return hasNegativeWeight(n, matrix) ? 1 : 0;
    }

    void dijkstra_wasm(int n, int src, double* mat, double* result) {
        vector<vector<long long>> matrix(n+1, vector<long long>(n+1, INF));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                long long val = (long long)mat[i * n + j];
                matrix[i+1][j+1] = val;
            }
        }

        vector<long long> dist(n + 1, INF);
        vector<bool> visited(n + 1, false);

        int current = src + 1;
        dist[src + 1] = 0;

        for (int step = 1; step <= n; step++) {
            visited[current] = true;

            for (int v = 1; v <= n; v++) {
                if (!visited[v] && matrix[current][v] < INF) {
                    if (dist[current] + matrix[current][v] < dist[v]) {
                        dist[v] = dist[current] + matrix[current][v];
                    }
                }
            }

            long long best = INF;
            int next = -1;
            for (int v = 1; v <= n; v++) {
                if (!visited[v] && dist[v] < best) {
                    best = dist[v];
                    next = v;
                }
            }

            if (next == -1) break;
            current = next;
        }

        for (int i = 1; i <= n; i++) {
            if (dist[i] == INF) {
                result[i-1] = 1e18;
            } else {
                result[i-1] = (double)dist[i];
            }
        }
    }

    void bellman_ford_wasm(int n, int src, int edgeCount, int* edgesU, int* edgesV, double* edgesW, double* result) {
        vector<Edge> edges;
        for (int i = 0; i < edgeCount; i++) {
            edges.push_back({edgesU[i], edgesV[i], (long long)edgesW[i]});
        }

        vector<long long> dist(n+1, INF);
        dist[src + 1] = 0;

        for (int i = 1; i <= n - 1; i++) {
            for (auto &e : edges) {
                if (dist[e.u] < INF && dist[e.u] + e.w < dist[e.v]) {
                    dist[e.v] = dist[e.u] + e.w;
                }
            }
        }

        for (int i = 1; i <= n; i++) {
            if (dist[i] == INF) {
                result[i-1] = 1e18;
            } else {
                result[i-1] = (double)dist[i];
            }
        }
    }

    double kruskal_wasm(int n, int edgeCount, int* edgesU, int* edgesV, double* edgesW) {
        vector<Edge> edges;
        for (int i = 0; i < edgeCount; i++) {
            edges.push_back({edgesU[i], edgesV[i], (long long)edgesW[i]});
        }
        long long result = kruskal(n, edges);
        return (double)result;
    }

    double prim_wasm(int n, double* mat) {
        vector<vector<long long>> matrix(n+1, vector<long long>(n+1, INF));
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                matrix[i+1][j+1] = (long long)mat[i * n + j];
            }
        }
        long long result = prim(n, matrix);
        return (double)result;
    }
}

/* MAIN */
int main() {
    int n;
    cin >> n;

    vector<vector<long long>> mat(n+1, vector<long long>(n+1, INF));
    vector<Edge> edges;

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            cin >> mat[i][j];
            if (i == j) mat[i][j] = 0;
            if (i < j && mat[i][j] < INF) {
                edges.push_back({i, j, mat[i][j]});
                edges.push_back({j, i, mat[i][j]});
            }
        }
    }

    int src;
    cin >> src;

   bool neg = hasNegativeWeight(n, mat);

    cout << "Bellman-Ford:\n";
    bellman_ford(n, src, edges);

    cout << "Dijkstra:\n";
    if (neg) {
        cout << "Khong chay Dijkstra vi co trong so am\n";
    } else {
        dijkstra(n, src, mat);
    }

    cout << kruskal(n, edges) << endl;
    cout << prim(n, mat) << endl;

    return 0;
}
