#include <iostream>

using namespace std;

int factorial(int n) {
    if (n) {
        return n * factorial(n - 1);
    }
    return 1;
}

int main() {
    ios::sync_with_stdio(false);
    
    int n; cin >> n;
    cout << factorial(n) << '\n';
    
    return 0;
}