#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
  ios::sync_with_stdio(false);
  int cases; cin >> cases;

  for (int i = 0; i < cases; i++) {
    int n, cnt = 0; cin >> n;
    vector<pair<int, int>> applicants(n);

    for (int j = 0; j < n; j++) cin >> applicants[j].first >> applicants[j].second;

    sort(applicants.begin(), applicants.end());

    int pos = 100'001;

    for (int j = 0; j < n; j++) {
      pair<int, int> a = applicants[j];

      if (a.second < pos) {
        cnt++; pos = a.second;
      }
    }
    cout << cnt << "\n";
  }

  return 0;
}