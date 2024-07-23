#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    
    int n, m; cin >> n >> m;
    vector<vector<int>> v(n);

    for (int i = 0; i < n; i++) {
        vector<int> buf(m);

        for (int j = 0; j < m; j++) {
            cin >> buf[j];
        }

        v[i] = buf;
    }  

    int nineSum = 0;

    vector<int> nineCountX(n);
    for (int i = 0; i < n; i++) {
        int cnt = 0;
        for (int j = 0; j < m; j++) {
            for (char x : to_string(v[i][j])) {
                if (x == '9') cnt += 1;
            }
        }
        
        nineSum += cnt;
        nineCountX[i] = cnt;
    }  
    
    vector<int> nineCountY(m);
    for (int i = 0; i < m; i++) {
        int cnt = 0;
        for (int j = 0; j < n; j++) {
            for (char x : to_string(v[j][i])) {
                if (x == '9') cnt += 1;
            }
        }
        
        nineCountY[i] = cnt;
    }

    sort(nineCountX.begin(), nineCountX.end());
    sort(nineCountY.begin(), nineCountY.end());

    if (nineCountX[n - 1] < nineCountY[m - 1]) {
        cout << nineSum - nineCountY[m - 1];
    } else {
        cout << nineSum - nineCountX[n - 1];
    }
    return 0;
}