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
    int total = 0;

    for (int i = 0; i < n; i++) {
        cin >> a[i];
        total += a[i];    
    }

    

    return 0;
}