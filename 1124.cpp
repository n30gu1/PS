#include <iostream>
#include <vector>

using namespace std;

int lenPrimeFact[100003];
bool isPrime[100003];

int main() {
    ios::sync_with_stdio(false);
    
    int a, b; 
    int cnt = 0;
    cin >> a >> b;

    lenPrimeFact[1] = 0;

    for (int i = 2; i <= 100003; i++) {
        isPrime[i] = true;
        for (int j = 2; j * j <= i; j++) {
			if (i % j == 0) {
                lenPrimeFact[i] = lenPrimeFact[i / j] + 1;
				isPrime[i] = false;
				break;
			}
		}
		if (isPrime[i])
            lenPrimeFact[i] = 1;
    }


    for (int i = a; i <= b; i++) {
        cnt += isPrime[lenPrimeFact[i]];
    }

    cout << cnt << "\n";
    
    return 0;
}