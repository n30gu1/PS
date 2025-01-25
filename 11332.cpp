#include <bits/stdc++.h>
#define INSTRUCTIONS_PER_SEC 100'000'000

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(0);

    int c; cin >> c;

    while (c--) {
        string tc; cin >> tc;
        long long n, t, l; cin >> n >> t >> l;
        bool mayFail = false;

        if (tc == "O(N)") {
            mayFail = n * t > l * INSTRUCTIONS_PER_SEC; 
        } else if (tc == "O(N^2)") {
            mayFail = n * n * t > l * INSTRUCTIONS_PER_SEC;
        } else if (tc == "O(N^3)") {
            mayFail = n * n * n * t > l * INSTRUCTIONS_PER_SEC;
        } else if (tc == "O(2^N)") {
            mayFail = n > log2(l * INSTRUCTIONS_PER_SEC / t);
        } else if (tc == "O(N!)") {
            double logNFact = [n] {
                double res = 0;
                for (int i = 1; i <= n; i++) res += log(i);
                return res;
            }();
            mayFail = logNFact > log(l * INSTRUCTIONS_PER_SEC / t);
        }

        cout << (mayFail ? "TLE!" : "May Pass.") << '\n';
    }

    return 0;
}