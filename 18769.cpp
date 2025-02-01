#include <vector>
#include <algorithm>
#include <iostream>

using namespace std;

struct DSU {
    vector<int> parent;
    vector<int> rank;

    DSU(int n) {
        parent.resize(n+1);
        rank.resize(n+1, 1);
        for(int i=0; i<=n; ++i) {
            parent[i] = i;
        }
    }

    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]);
        }
        return parent[x];
    }

    bool unite(int x, int y) {
        int fx = find(x);
        int fy = find(y);
        if (fx == fy) return false;
        if (rank[fx] < rank[fy]) {
            parent[fx] = fy;
        } else {
            parent[fy] = fx;
            if (rank[fx] == rank[fy]) {
                rank[fx]++;
            }
        }
        return true;
    }
};

int main() {
    int N, M;
    vector<tuple<int, int, int>> edges;
    cin >> N >> M;

    // Read edges and sort them
    for(int i=0; i<M; ++i) {
        int a, b, c;
        cin >> a >> b >> c;
        edges.push_back( make_tuple(a, b, c) );
    }
    sort(edges.begin(), edges.end(), [](const tuple<int,int,int>& a, const tuple<int,int,int>& b) {
        return get<2>(a) < get<2>(b);
    });

    DSU dsu(N);
    int total = 0;
    int max_e = 0;
    for(auto& e : edges) {
        int a = get<0>(e);
        int b = get<1>(e);
        int w = get<2>(e);
        if (dsu.find(a) != dsu.find(b)) {
            dsu.unite(a, b);
            total += w;
            if (w > max_e) {
                max_e = w;
            }
        }
    }
    // The answer is total - max_e
    cout << (total - max_e) << endl;
    return 0;
}