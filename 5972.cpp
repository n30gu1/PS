#include <bits/stdc++.h>
using namespace std;
#define rep(i, a, b) for(int i = a; i < (b); i++)
#define all(x) begin(x), end(x)
#define modernall(x) x.begin(), x.end()
#define sz(x) (int)(x).size()
typedef long long ll;
typedef pair<int, int> pii;
typedef vector<int> vi;
typedef vector<vector<int> > vvi;

int v, e;

vi dijkstra(int source, vector<vector<pii> > &graph) {
    priority_queue<pii, vector<pii>, greater<> > pq;
    vi dist(v, INT_MAX);
    dist[source] = 0;

    pq.emplace(dist[source], source);

    while (!pq.empty()) {
        int w = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        for (auto x: graph[u]) {
            int vt = x.first;
            int wt = x.second;

            if (vt == u) continue;

            if (dist[vt] > w + wt) {
                dist[vt] = w + wt;
                pq.emplace(dist[vt], vt);
            }
        }
    }

    return dist;
}

int main() {
    cin.tie(0)->sync_with_stdio(0);
    cin.exceptions(cin.failbit);

    cin >> v >> e;

    vector<vector<pii> > graph(v);

    rep(_, 0, e) {
        int i, j, w;
        cin >> i >> j >> w;
        i--; j--;
        graph[i].emplace_back(j, w);
        graph[j].emplace_back(i, w);
    }

    auto dijk = dijkstra(0, graph);

    cout << dijk[v - 1] << '\n';
    return 0;
}
