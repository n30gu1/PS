#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

struct DSU {
    vector<int> parent;
    vector<int> rank;

    DSU(int n) : parent(n), rank(n) {
        for (int i = 0; i < n; ++i) {
            parent[i] = i;
        }
    }

    int find(int u) {
        if (parent[u] != u)
            parent[u] = find(parent[u]);
        return parent[u];
    }

    void unite(int u, int v) {
        u = find(u);
        v = find(v);
        if (u == v) return;

        if (rank[u] < rank[v]) {
            parent[u] = v;
        } else {
            parent[v] = u;
            if (rank[u] == rank[v]) rank[u]++;
        }
    }
};

int main() {
    int N;
    cin >> N;

    vector<vector<int>> adj(N);

    for (int i = 0; i < N; ++i) {
        vector<int> row(N);
        for (int j = 0; j < N; ++j) {
            cin >> row[j];
        }
        adj[i] = row;
    }

    vector<pair<int, pair<int, int>>> edges;

    for (int i = 0; i < N - 1; ++i) {
        for (int j = i + 1; j < N; ++j) {
            if (adj[i][j] != 0) {
                edges.push_back({adj[i][j], {i, j}});
            }
        }
    }

    sort(edges.begin(), edges.end());

    DSU dsu(N);

    long long sum = 0;
    int count_edges = 0;

    for (const auto &edge : edges) {
        int u = edge.second.first;
        int v = edge.second.second;

        if (dsu.find(u) != dsu.find(v)) {
            dsu.unite(u, v);
            sum += edge.first;
            count_edges++;

            if (count_edges == N - 1) break;
        }
    }

    cout << sum << endl;

    return 0;
}
