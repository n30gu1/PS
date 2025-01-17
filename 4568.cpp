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

    int simcnt = 1;

    while (true) {
        int n; cin >> n;
        if (n == 0) break;
        cout << "Simulation " << simcnt++ << "\n";

        string s; cin >> s;
        vector<char> cache = {};

        for (char c : s) {
            if (c == '!') {
                for (char ch : cache) {
                    cout << ch;
                }
                cout << '\n';
                continue;
            }

            cache.erase(remove(all(cache), c), end(cache));
            if (sz(cache) == n) cache.erase(begin(cache));
            cache.push_back(c);
        }
    }

    return 0;
}