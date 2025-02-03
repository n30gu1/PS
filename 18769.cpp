#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct Edge {
    int u, v, cost;
    Edge(int u, int v, int cost) : u(u), v(v), cost(cost) {}
};

struct DSU {
    vector<int> parent, rank;
    DSU(int n) : parent(n), rank(n, 1) {
        for (int i = 0; i < n; i++) parent[i] = i;
    }

    int find_set(int u) {
        if (u != parent[u]) parent[u] = find_set(parent[u]);
        return parent[u];
    }

    void union_sets(int u, int v) {
        u = find_set(u);
        v = find_set(v);
        if (u != v) {
            if (rank[u] > rank[v]) parent[v] = u;
            else if (rank[u] < rank[v]) parent[u] = v;
            else {
                parent[v] = u;
                rank[u]++;
            }
        }
    }
};

int main() {
    int T;
    cin >> T;
    while (T--) {
        int R, C;
        cin >> R >> C;
        vector<Edge> edges;
        for (int i = 0; i < R; i++) {
            for (int j = 0; j < C-1; j++) {
                int cost;
                cin >> cost;
                edges.push_back(Edge(i*C+j, i*C+j+1, cost));
            }
        }
        for (int i = 0; i < R-1; i++) {
            for (int j = 0; j < C; j++) {
                int cost;
                cin >> cost;
                edges.push_back(Edge(i*C+j, (i+1)*C+j, cost));
            }
        }
        sort(edges.begin(), edges.end(), [](const Edge& a, const Edge& b) {
            return a.cost < b.cost;
        });
        DSU dsu(R*C);
        int total_cost = 0;
        for (const Edge& e : edges) {
            if (dsu.find_set(e.u) != dsu.find_set(e.v)) {
                dsu.union_sets(e.u, e.v);
                total_cost += e.cost;
            }
        }
        cout << total_cost << endl;
    }
    return 0;
}