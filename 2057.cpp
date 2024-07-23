#include <iostream>
#include <vector>
using namespace std;

long long factorial(long long n) {
    if (n == 0 || n == 1) return 1;
    long long result = 1;
    for (long long i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

bool canBeExpressed(long long N, long long current, vector<long long>& factorials) {
    if (N == 0) return true;
    if (N < 0 || current < 0) return false;
    
    if (canBeExpressed(N - factorials[current], current - 1, factorials)) return true;
    
    return canBeExpressed(N, current - 1, factorials);
}

int main() {
    long long N;
    cin >> N;
    
    vector<long long> factorials;
    for (long long i = 0; ; ++i) {
        long long fact = factorial(i);
        if (fact > N) break;
        factorials.push_back(fact);
    }

    if (canBeExpressed(N, factorials.size() - 1, factorials) && N != 0) {
        cout << "YES" << endl;
    } else {
        cout << "NO" << endl;
    }
    
    return 0;
}