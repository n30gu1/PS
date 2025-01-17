#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int bin_search(int arr[], int target, int start, int end) {
    while (start <= end) {
        int mid = (start + end) / 2;
        if (arr[mid] == target) return 1;
        else if (arr[mid] > target) end = mid - 1;
        else start = mid + 1;
    }

    return 0;
}

int main() {
    cin.tie(NULL);
    cout.tie(NULL);
    ios::sync_with_stdio(false);

    int n, m;

    cin >> n;
    int cards[n + 1];
    
    for (int i = 0; i < n; i++) {
        int buf;
        cin >> buf;
        cards[i] = buf;
    }

    sort(cards, cards + n);
    cin >> m;

    while (m--) {
        int buf;
        cin >> buf;
        cout << bin_search(cards, buf, 0, n - 1) << '\n';
    }

    return 0;
}