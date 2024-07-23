#include <iostream>
#include <vector>
using namespace std;
int main() {
    ios::sync_with_stdio(false);
    vector<int> numbers(9);
    int sum = 0;
    int N, M;

    for (int i = 0; i < 9; i++) {
        cin >> numbers[i];
        sum += numbers[i];
    }

    for (int n : numbers) {
        for (int m: numbers) {
            if (n == m) continue;

            if (sum - n - m == 100) {
                N = n;
                M = m;
            }
        }
    }

    for (int n : numbers) {
        if (n != N && n != M) cout << n << "\n";
    }

    return 0;
}