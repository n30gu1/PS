#include <iostream>
#include <set>
#include <vector>
#include <algorithm>

using namespace std;

struct Country {
    int id;
    int gold;
    int silver;
    int bronze;
};

int main() {
    ios::sync_with_stdio(false);
    cin.tie(NULL);
    
    int n, k; cin >> n >> k;
    
    vector<Country> list(n);

    for (int i = 0; i < n; i++) {
        int id, gold, silver, bronze;
        cin >> id >> gold >> silver >> bronze;
        list[i] = Country { id, gold, silver, bronze };
    }

    sort(list.begin(), list.end(), [](const Country a, const Country b){
        if (a.gold > b.gold) {
            return true;
        }
        else if (a.gold == b.gold && a.silver > b.silver) {
            return true;
        }
        else if (a.gold == b.gold && a.silver == b.silver && a.bronze > b.bronze) {
            return true;
        }
        return false;
    });

    int cnt = 1;
    int buf = 0;

    if (list[0].id == k) {
        cout << cnt;
    } else {
        for (int i = 1; i < n; i++) {
            Country a = list[i - 1];
            Country b = list[i];

            if (
                a.gold == b.gold &&
                a.silver == b.silver &&
                a.bronze == b.bronze
            ) {
                buf++;
            } else {
                if (buf > 0) {
                    cnt += buf;
                    buf = 1;
                } else {
                    cnt += 1;
                }
            }

            if (b.id == k) {
                cout << cnt;
                break;
            }
        }
    }


    return 0;
}