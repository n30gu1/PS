#include <iostream>
#include <vector>

using namespace std;

char convert(char in) {
    switch ((int)in) {
        case 45:
            return (char)124;
        case 124:
            return (char)45;
        case 47:
            return (char)92;
        case 92:
            return (char)47;
        case 94:
            return (char)60;
        case 60:
            return (char)118;
        case 118:
            return (char)62;
        case 62:
            return (char)94;
        default:
            return in;
    }
}

int main() {
    ios::sync_with_stdio(false);
    int n, m; cin >> n >> m;
    vector<vector<char>> vec(m);

    for (int i = 0; i < n; i++) {
        for (int j = m - 1; j >= 0; j--) {
            char buf;
            cin >> buf;
            vec[j].push_back(convert(buf));
        }
    }

    
    for (int i = 0; i < m; i++) {
        for (int j = 0; j < n; j++) {
            cout << vec[i][j];
        }
        cout << "\n";
    }

    return 0;
}