#include <iostream>
#include <vector>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    
    int n; cin >> n;
    string direction;
    int deg = 0, sizeX = 0, sizeY = 0;
    int deltaX = 0, deltaY = 0;

    vector<char> operations;
    int rCount = 0, lCount = 0, uCount = 0, dCount = 0;

    vector<vector<char>> map(101, vector<char>(101, '#'));
    pair<int, int> pos = {50, 50};
    
    getline(cin, direction);

    for (char c : direction) {
        switch (c) {
        case 'F':
            switch (deg) {
                case 0:
                    operations.push_back('D');
                    dCount++;
                    deltaY--;
                    break;
                case 90:
                    operations.push_back('L');
                    lCount++;
                    deltaX--;
                    break;
                case 180:
                    operations.push_back('U');
                    uCount++;
                    deltaY++;
                    break;
                case 270:
                    operations.push_back('R');
                    rCount++;
                    deltaX++;
                    break;
                default:
                    break;
            }
            break;
        case 'L':
            deg -= 90;
            break;
        case 'R':
            deg += 90;
            break;
        
        default:
            break;
        }

        if (deg == 360) deg = 0;
        if (deg == -90) deg = 270;
    }

    map[pos.second][pos.first] = '.';
    for (char c : operations) {
        switch (c) {
        case 'D':
            pos.second++;
            map[pos.second][pos.first] = '.';
            break;
        case 'L':
            pos.first--;
            map[pos.second][pos.first] = '.';
            break;
        case 'U':
            pos.second--;
            map[pos.second][pos.first] = '.';
            break;
        case 'R':
            pos.first++;
            map[pos.second][pos.first] = '.';
            break;
        default:
            break;
        }

        
    }

    for (int i = 50 + (minY < 0 ? minY : 0); i < 50 + ; i++) {
        for (int j = 50 - (minX < 0 ? minX : 0); j < 50 + sizeX - minX; j++) {
            cout << map[i][j];
        }
        cout << '\n';
    }

    return 0;
}