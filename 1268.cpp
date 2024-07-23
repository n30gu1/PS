#include <iostream>
#include <algorithm>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    
    int n; cin >> n;
    vector<vector<int>> students;

    for (int i = 0; i < n; i++) {
        vector<int> buf(5);
        for (int j = 0; j < 5; j++) {
            cin >> buf[j];
        }

        students.push_back(buf);
    }

    vector<pair<int, int>> occurrences(n);

    for (int i = 0; i < 5; i++) {
        for (int j = 0; j < n; j++) {
            occurrences[j].first = j + 1;

            for (int k = 0; k < n; k++) {
                if (j != k) {
                    int a = students[j][i];
                    int b = students[k][i];

                    if (a == b) occurrences[j].second++;
                }
            }

        }
    }

    sort(occurrences.begin(), occurrences.end(), [](const auto a, const auto b) {
        if (a.second == b.second) {
            return a.first < b.first;
        } else {
            return a.second > b.second;
        }
    });

    cout << occurrences[0].first;

    return 0;
}