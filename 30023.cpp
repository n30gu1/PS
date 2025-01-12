#include <bits/stdc++.h>
using namespace std;
#define all(x) begin(x), end(x)
#define sz(x) (int)(x).size()
typedef long long ll;
typedef pair<int, int> pii;
typedef vector<int> vi;

ll solveTarget(const vector<int> &v, int n, int target) {
    vi diff(n + 1, 0);
    ll ans = 0, flips = 0;
    for (int i = 0; i < n; i++) {
        flips += diff[i];
        int cur = (v[i] + flips) % 3;
        int shift = (target - cur + 3) % 3;
        if (shift) {
            if (i + 2 >= n) return -1;
            ans += shift;
            flips += shift;
            diff[i + 3] -= shift;
        }
    }
    return ans;
}

int main() {
    cin.tie(0)->sync_with_stdio(0);
    cin.exceptions(cin.failbit);

    int n; cin >> n;
    vi v(n);
    for (int i = 0; i < n; i++) {
        char c; cin >> c;
        switch (c) {
            case 'R': v[i] = 0; break;
            case 'G': v[i] = 1; break;
            case 'B': v[i] = 2; break;
            default: break;
        }
    }

    ll res = LLONG_MAX;
    for (int color = 0; color < 3; color++) {
        ll r = solveTarget(v, n, color);
        if (r >= 0) res = min(res, r);
    }

    cout << (res == LLONG_MAX ? -1 : res) << "\n";
    
    return 0;
}