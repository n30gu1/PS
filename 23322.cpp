#include <bits/stdc++.h>

using namespace std;

int n, k;
pair<int, int> res = {0, 0};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);

    cin >> n >> k;
    vector<int> v(n + 1);

    for (int i = 1; i <= n; i++) {
        cin >> v[i];
    }

    for (int i = 2; i <= n; i++) {
        if (v[i] > v[1]) {
            res.first += v[i] - v[1];
            res.second++;
        }
    }

    cout << res.first << ' ' << res.second << '\n';

    return 0;
}