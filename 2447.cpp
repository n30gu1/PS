#include <iostream>
#include <vector>

using namespace std;

void draw(vector<vector<char>> &grid, int n, vector<vector<char>> shape) {
    vector<vector<char>> newShape(shape[0].size() * 3, vector<char>(shape[0].size() * 3));
    if (n > 3) {
        for (int x = 0; x < shape[0].size() * 3; x += shape[0].size()) {
            for (int y = 0; y < shape[0].size() * 3; y += shape[0].size()) {
                for (int i = 0; i < shape[0].size(); i++) {
                    for (int j = 0; j < shape[0].size(); j++) {
                        if (x == shape[0].size() && x == y) {
                            grid[x + i][y + j] = ' ';
                            newShape[x + i][y + j] = ' ';
                        } else {
                            grid[x + i][y + j] = shape[i][j];
                            newShape[x + i][y + j] = shape[i][j];
                        }
                    }
                }
            }
        }
        draw(grid, n - shape[0].size() * 3, newShape);
    } else if (n > 0) {
        for (int i = 0; i < shape[0].size(); i++) {
            for (int j = 0; j < shape[0].size(); j++) {
                grid[i][j] = shape[i][j];
            }
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    
    int n; cin >> n;

    vector<vector<char>> grid(n, vector<char>(n));

    vector<vector<char>> shape = {
        {'*', '*', '*'},
        {'*', ' ', '*'},
        {'*', '*', '*'},
    };

    draw(grid, n, shape);

    for (int i = 0; i < grid.size(); i++) {
        for (int j = 0; j < grid.size(); j++) {
            cout << grid[i][j];
        }
        cout << '\n';
    }
    
    return 0;
}