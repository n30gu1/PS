#include <bits/stdc++.h>
using namespace std;
#define all(x) begin(x), end(x)
#define sz(x) (int)(x).size()
typedef long long ll;
typedef pair<int, int> pii;
typedef vector<int> vi;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string s; cin >> s;
    deque<char> left, right;
    for (char c : s) left.push_back(c);
    
    int n; cin >> n;

    while (n--) {
        string cmd; cin >> cmd;
        if (cmd == "L") {
            if (!left.empty()) { right.push_front(left.back()); left.pop_back(); }
        } else if (cmd == "D") {
            if (!right.empty()) { left.push_back(right.front()); right.pop_front(); }
        } else if (cmd == "B") {
            if (!left.empty()) left.pop_back();
        } else if (cmd == "P") {
            char c; cin >> c;
            left.push_back(c);
        }
    }
    
    for (char c : left) cout << c;
    for (char c : right) cout << c;
    cout << '\n';
    return 0;
}