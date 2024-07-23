#include <iostream>
#include <cmath>
#include <vector>

using namespace std;

long long validators(long long n, long long c) {
    if (n > 0) {
        if (n % c == 0) {
            return n / c;
        } else {
            return (n / c) + 1;
        }
    }

    return 0;
}

int main() {
    ios::sync_with_stdio(false);
    
    long long n; cin >> n;
    vector<long long> a_i(n);
    for (long long i = 0; i < n; i++) {
        cin >> a_i[i];
        
    }
    long long b, c; cin >> b >> c;

    long long cnt = 0;
    for (long long a : a_i) {
        cnt++;
        cnt += validators(a - b, c);
    }

    cout << cnt << '\n';
    
    return 0;
}