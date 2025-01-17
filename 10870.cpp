#include <iostream>

using namespace std;

int fib(int a, int b, int cnt) {
    if (cnt) {
        return fib(b, a + b, cnt - 1);
    }
    return a + b;
}

int main() {
    ios::sync_with_stdio(false);
    
    int n; cin >> n;
    cout << ((n == 0) ? 0 : ((n == 1) ? 1 : fib(0, 1, n - 2))) << '\n';
    
    return 0;
}