#include <iostream>
#include <vector>
#include <math.h>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    int n, k, cnt = 0; cin >> n >> k;
    bool done = false;
    vector<int> visited(n + 2);

    for (int i = 2; i <= n; i++) {
        if (done) break;
        cnt++;

        if (cnt == k) {
            cout << i << "\n";
            done = true;
            break;
        }

        for (int j = i * 2; j <= n; j += i) {
            if (visited[j]) continue;
            visited[j] = true;
            cnt++;

            if (cnt == k) {
                cout << j << "\n";
                done = true;
                break;
            }
        }
    }

    return 0;
}