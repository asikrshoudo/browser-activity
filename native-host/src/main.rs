use serde_json::{json, Value};
use std::io::{self, Read, Write};

fn read_message(input: &mut impl Read) -> io::Result<Option<Value>> {
    let mut len_buf = [0u8; 4];
    match input.read_exact(&mut len_buf) {
        Ok(()) => {}
        Err(e) if e.kind() == io::ErrorKind::UnexpectedEof => return Ok(None),
        Err(e) => return Err(e),
    }
    let len = u32::from_ne_bytes(len_buf) as usize;
    let mut buf = vec![0u8; len];
    input.read_exact(&mut buf)?;
    Ok(Some(serde_json::from_slice(&buf)?))
}

fn write_message(output: &mut impl Write, value: &Value) -> io::Result<()> {
    let data = serde_json::to_vec(value)?;
    output.write_all(&(data.len() as u32).to_ne_bytes())?;
    output.write_all(&data)?;
    output.flush()
}

fn main() -> io::Result<()> {
    let mut stdin = io::stdin().lock();
    let mut stdout = io::stdout().lock();

    while let Some(message) = read_message(&mut stdin)? {
        let reply = match message.get("type").and_then(Value::as_str) {
            Some("ping") => json!({ "type": "pong" }),
            _ => json!({ "type": "error", "error": "unknown message type" }),
        };
        write_message(&mut stdout, &reply)?;
    }

    Ok(())
}
