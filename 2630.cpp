#include <iostream>
#include <vector>

using namespace std;

int blk = 0; w = 0;

int main() {
    ios::sync_with_stdio(false);
    
    vector<vector<int>> paper;
    int n; cin >> n;

    for (int i = 0; i < n; i++) {
        vector<int> tmp;
        for (int j = 0; j < n; j++) {
            int t; cin >> t;
            tmp.push_back(t);
        }
        paper.push_back(tmp);
    }
    
    vector<vector<int>> cache;
    
    while (cache.size() > 1) {
        int ref = cache[0][0];
        bool flag = true;

        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (paper[i][j] != ref) {
                    flag = false;
                    break;
                }
            }
        }

        if (flag) {
            ref == 0 ? w++ : blk++;
            break;
        }

        cache = cache[]
    }

    return 0;
}