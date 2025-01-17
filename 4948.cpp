#include <iostream>
#include <cmath>
#include <vector>
#include <cstring>

using namespace std;

bool isPrime[246913];

int main() {
    ios::sync_with_stdio(false);
    
    memset(isPrime, 1, sizeof(isPrime));
    isPrime[0] = false;
    isPrime[1] = false;

    for (int i = 2; i <= 496; i++)
        if (isPrime[i])
            for (int j = i * i; j <= 246912; j += i) isPrime[j] = false;


    while (true) {
        int n; cin >> n; if (n == 0) break;

        int cnt = 0;
        for (int i = n + 1; i <= 2 * n; i++) {
            if (isPrime[i]) {
                cnt++;
            }
        }

        cout << cnt << "\n";
    }
    
    return 0;
}