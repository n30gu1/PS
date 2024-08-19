use std::io::{self, BufRead, BufWriter, Write};

pub fn main() {
    let kn = (|| {
        let binding = io::stdin().lock().lines().next().unwrap().unwrap();
        let buf = binding
                    .split_once(' ')
                    .unwrap();
        (buf.0.parse::<usize>().unwrap(), buf.1.parse::<usize>().unwrap())
    })();

    let mut lan_cables: Vec<i32> = vec![];

    for _ in 0..kn.0 {
        let buf = io::stdin().lock().lines().next().unwrap().unwrap()
                        .parse::<i32>().unwrap();
        lan_cables.push(buf);
    }

    
    let mut writer = BufWriter::new(io::stdout());
}