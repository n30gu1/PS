use std::io;
use std::collections::HashSet;

fn input() -> String {
    io::stdin().lines().next().unwrap().unwrap()
}

pub fn main() {
    let n: usize = input().parse().unwrap();
    let arr: Vec<i32> = input()
        .split(' ')
        .map(|x| x.parse().unwrap())
        .collect();

    let mut cnt = 0;
    let mut set = HashSet::new();
    let mut right = 0;

    for left in 0..n {
        while right < n && !set.contains(&arr[right]) {
            set.insert(arr[right]);
            right += 1;
        }
        cnt += right - left;
        set.remove(&arr[left]);
    }

    println!("{}", cnt);
}