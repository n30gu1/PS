use std::io::{self, BufRead};

fn validate(px: &[Vec<i32>], res_array: &mut Vec<Box<dyn std::any::Any>>, pos: usize) {
    let x = px[0][0];
    let mut flag = true;
    for row in px {
        for &val in row {
            if val != x {
                flag = false;
                break;
            }
        }
        if !flag {
            break;
        }
    }

    if flag {
        res_array.insert(pos, Box::new(x));
    } else {
        res_array.insert(pos, Box::new(Vec::<Box<dyn std::any::Any>>::new()));
        if let Some(sub_array) = res_array[pos].downcast_mut::<Vec<Box<dyn std::any::Any>>>() {
            validate(&px[..px.len() / 2].iter().map(|e| e[..e.len() / 2].to_vec()).collect::<Vec<_>>(), sub_array, 0);
            validate(&px[..px.len() / 2].iter().map(|e| e[e.len() / 2..].to_vec()).collect::<Vec<_>>(), sub_array, 1);
            validate(&px[px.len() / 2..].iter().map(|e| e[..e.len() / 2].to_vec()).collect::<Vec<_>>(), sub_array, 2);
            validate(&px[px.len() / 2..].iter().map(|e| e[e.len() / 2..].to_vec()).collect::<Vec<_>>(), sub_array, 3);
        }
    }
}

fn arr_log(arr: &[Box<dyn std::any::Any>], result: &mut String) {
    for e in arr {
        if let Some(sub_array) = e.downcast_ref::<Vec<Box<dyn std::any::Any>>>() {
            result.push('(');
            arr_log(sub_array, result);
            result.push(')');
        } else if let Some(&val) = e.downcast_ref::<i32>() {
            result.push_str(&val.to_string());
        }
    }
}

pub fn main() {
    let stdin = io::stdin();
    let mut lines = stdin.lock().lines();

    let n: usize = lines.next().unwrap().unwrap().parse().unwrap();
    let mut buf: Vec<Vec<i32>> = Vec::new();

    for _ in 0..n {
        let line = lines.next().unwrap().unwrap();
        buf.push(line.chars().map(|c| c.to_digit(10).unwrap() as i32).collect());
    }

    let mut compressed: Vec<Box<dyn std::any::Any>> = Vec::new();
    validate(&buf, &mut compressed, 0);

    let mut result = String::new();
    arr_log(&compressed, &mut result);

    println!("{}", result);
}
