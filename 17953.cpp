#include <bits/stdc++.h>
using namespace std;
#define all(x) begin(x), end(x)
#define sz(x) (int)(x).size()
typedef long long ll;
typedef pair<int, int> pii;
typedef vector<int> vi;

int main() {
    cin.tie(0)->sync_with_stdio(0);
    cin.exceptions(cin.failbit);

    int n, m; cin >> n >> m;
    vector<vi> v(m + 1, vi(n + 1)); for (int i = 1; i <= m; i++) for (int j = 1; j <= n; j++) cin >> v[i][j];

    vector<vi> dp(m + 1, vi(n + 1));
    int ans = -1;

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            ll tmp = 0;
            for (int k = 1; k <= m; k++){
                if (i != 1 && j == k)
                    tmp = max((ll)(dp[k][i-1] + v[j][i]/2), tmp);
                else
                    tmp = max((ll)(dp[k][i-1] + v[j][i]), tmp);
            }
            dp[j][i] = tmp;
        }
    }

    for (int i = 1; i <= m; i++)
        ans = max(dp[i][n], ans);

    cout << ans << '\n';
    return 0;
}