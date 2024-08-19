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


fn dynamic_fibonacci(n: usize, zeros: &mut Vec<i32>, ones: &mut Vec<i32>) -> (i32, i32) {
    if n as usize >= zeros.len() {
        for i in zeros.len()..=n {
            zeros.push(zeros[i - 1] + zeros[i - 2]);
            ones.push(ones[i - 1] + ones[i - 2]);
        }
    }
    (zeros[n], ones[n])
}

pub fn main() {
    let t = input().parse::<i32>().unwrap();

    let mut zeros: Vec<i32> = vec![1, 0];
    let mut ones: Vec<i32> = vec![0, 1];

    for _ in 0..t {
        let n = input().parse::<usize>().unwrap();
        let val = dynamic_fibonacci(n, &mut zeros, &mut ones);

        print_fast!("{} {}\n", val.0, val.1);
    }
}