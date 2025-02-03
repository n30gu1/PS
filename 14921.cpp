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

    int n; cin >> n;

    vi a(n);

    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    int ans = INT_MAX;
    bool isSmallerThanZero = false;

    int lhs = 0;
    int rhs = n - 1;

    while (lhs < rhs) {
        int val = abs(a[lhs] + a[rhs]);
        if (val < ans) {
            ans = val;
            isSmallerThanZero = a[lhs] + a[rhs] < 0;
        }

        if (a[lhs] + a[rhs] < 0) lhs++;
        else rhs--;
    }

    cout << (isSmallerThanZero ? -ans : ans) << '\n';

    return 0;
}