#include <algorithm>
#include <iostream>
#include <vector>
#include <math.h>
using namespace std;

int main() {
  ios::sync_with_stdio(false);

  int N;
  cin >> N;

  for (int i = 0; i < N; i++) {
    int n;
    cin >> n;

    vector<int> raw(n), result(n + 1);
    for (int j = 0; j < n; j++) cin >> raw[j];
    sort(raw.begin(), raw.end());

    for (int j = raw.size() - 1; j >= 0; j -= 2) result[floor(n / 2) + floor((n - 1 - j) / 2)] = raw[j];
    for (int j = raw.size() - 2; j >= 0; j -= 2) result[floor(n / 2) - floor((n - 1 - j) / 2) - 1] = raw[j];
    result[n] = result[0];

    int diff = 0;

    for (int j = 0; j < n; j++) {
      int cand = abs(result[j] - result[j + 1]);
      if (cand > diff) diff = cand;
    }

    cout << diff << "\n";
  } 
}