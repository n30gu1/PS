use std::io::{self, BufWriter, Write};

macro_rules! print_fast {
    ($($arg:tt)*) => {
        let mut writer = BufWriter::new(io::stdout());
        writer.write(format!($($arg)*).as_bytes()).unwrap();
        writer.flush().unwrap();
    }
}

fn input() -> String {
    io::stdin().lines().next().unwrap().unwrap()
}

fn solve(board: &Vec<Vec<i64>>, cnt: i64) -> i64 {
    let stride = board[0][0] as usize;
    if stride == 0 {
        return cnt + 1;
    } else if stride >= board.len() {
        return solve(&board.iter().map(|v| {v[stride..].to_vec()}).collect::<Vec<Vec<i64>>>(), cnt);
    } else if stride >= board[0].len() {
        return solve(&board[stride..].to_vec(), cnt);
    }
    solve(&board[stride..].to_vec(), cnt) 
    + solve(&board.iter().map(|v| {v[stride..].to_vec()}).collect::<Vec<Vec<i64>>>(), cnt)
}

pub fn main() {
    let n = input().parse::<usize>().unwrap();
    let mut board: Vec<Vec<i64>> = vec![];

    for _ in 0..n {
        let numbers = input()
                        .split(' ')
                        .map(|x| x.parse::<i64>().unwrap())
                        .collect::<Vec<i64>>();
        
        board.push(numbers);
    }

    print_fast!("{}\n", solve(&board, 0));
}