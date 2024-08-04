use std::io;

fn validate(paper: Vec<Vec<i32>>, result: &mut Vec<i32>) {
    let buf = paper[0][0];
    let mut flag = true;
    let n = paper.len() as i32;
    for i in 0..n {
        for j in 0..n {
            if paper[i as usize][j as usize] != buf {
                flag = false;
                break;
            }
        }
    }

    if flag {
        if buf == -1 {
            result[0] += 1;
        } else if buf == 0 {
            result[1] += 1;
        } else {
            result[2] += 1;
        }
    } else {
        for i in 0..3 {
            for j in 0..3 {
                let mut new_paper = Vec::new();
                for k in 0..n / 3 {
                    new_paper.push(paper[(i * n / 3 + k) as usize][(j * n / 3) as usize..(j * n / 3 + n / 3) as usize].to_vec());
                }
                validate(new_paper, result);
            }
        }
    }
}

pub fn main() {
    let mut input = String::new();

    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse::<i32>().unwrap();

    let mut paper = Vec::new();

    for _ in 0..n {
        input.clear();
        io::stdin().read_line(&mut input).unwrap();
        paper.push(input.trim().split_whitespace().map(|x| x.parse::<i32>().unwrap()).collect::<Vec<i32>>());
    }

    let mut result: Vec<i32> = vec![0, 0, 0];

    validate(paper, &mut result);

    println!("{}", result[0]);
    println!("{}", result[1]);
    println!("{}", result[2]);
}