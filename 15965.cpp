#include <iostream>
#include <cmath>
#include <vector>
#include <cstring>

using namespace std;

bool isPrime[7368790];
vector<int> prime;

int main() {
    ios::sync_with_stdio(false);
    
    int k; cin >> k;

    memset(isPrime, 1, sizeof(isPrime));
    isPrime[0] = false;
    isPrime[1] = false;

    for (int i = 2; i <= sqrt(7368787); i++)
        if (isPrime[i])
            for (int j = i * i; j <= 7368787; j += i) isPrime[j] = false;

    for (int i = 2; i <= 7368787; i++) if (isPrime[i]) prime.push_back(i);
    
    cout << prime[k-1];
    return 0;
}