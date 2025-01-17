#include <iostream>
using namespace std;
int main() {
  ios::sync_with_stdio(false);
  int n;
  long long sum = 0;
  cin >> n;

  for (int i = 0; i < n * n; i++) {
    int buf; cin >> buf;
    sum += buf;
  }

  cout << sum << "\n";
  return 0;
}