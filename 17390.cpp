#include <iostream>
#include <vector>
using namespace std;

int cnt[1001];

int main() {
  ios::sync_with_stdio(false);
  cin.tie(NULL);
  int n, m; cin >> n >> m;
  vector<int> vec;
  vector<int> accum = {0};

  for (int i = 0; i < n; i++) {
    int x;
    cin >> x;
    cnt[x]++;
  }

  for (int i = 1; i <= 1000; i++) {
    while (cnt[i]--) {
      vec.push_back(i);
    }
  }

  for (int i = 0; i < n; i++) accum.push_back(accum[i] + vec[i]);

  for (int i = 0; i < m; i++) {
    int l, r;
    cin >> l >> r;

    cout << accum[r] - accum[l - 1] << "\n";
  }

  return 0;
}