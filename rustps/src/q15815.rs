use std::io;

fn calculate(a: i32, b: i32, operator: char) -> i32 {
    match operator {
        '+' => a + b,
        '-' => a - b,
        '*' => a * b,
        '/' => a / b,
        _ => 0,
    }
}

pub fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();

    let mut numbers: Vec<i32> = Vec::new();

    for c in input.chars() {
        if c.is_digit(10) {
            numbers.push(c.to_digit(10).unwrap() as i32);
        } else {
            if c != '\n' {
                let b = numbers.pop().unwrap() as i32;
                let a = numbers.pop().unwrap() as i32;
                numbers.push(calculate(a, b, c));
            }
        }
    }

    println!("{}", numbers.pop().unwrap());
}