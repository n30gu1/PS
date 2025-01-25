#include <bits/stdc++.h>

using namespace std;

int main() {
    int t; cin >> t;

    while (t--) {
        int W, n; cin >> W >> n;

        int cap = W;
        int miles = 0;
        int prevX = 0;

        for (int i = 0; i < n; i++) {
            int x, w; cin >> x >> w;
            miles += x - prevX;

            if (w > cap) {
                miles += x * 2;
                cap = W;
            }

            cap -= w;

            if (cap == 0) {
                miles += x;
                cap = W;
                prevX = 0;
                continue;
            }

            prevX = x;
        }

        miles += prevX;

        cout << miles << '\n';
    }
    return 0;
}