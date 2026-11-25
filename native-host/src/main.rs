use serde_json::{json, Value};
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};

const CLIENT_ID: &str = "1574969214106603621";
const OP_HANDSHAKE: u32 = 0;
const OP_FRAME: u32 = 1;

struct Discord {
    pipe: File,
    nonce: u64,
}

impl Discord {
    fn connect() -> io::Result<Self> {
        let mut last = io::Error::new(io::ErrorKind::NotFound, "discord is not running");
        for i in 0..10 {
            let path = format!(r"\\.\pipe\discord-ipc-{i}");
            match OpenOptions::new().read(true).write(true).open(&path) {
                Ok(pipe) => {
                    let mut discord = Discord { pipe, nonce: 0 };
                    discord.send(OP_HANDSHAKE, &json!({ "v": 1, "client_id": CLIENT_ID }))?;
                    discord.recv()?;
                    return Ok(discord);
                }
                Err(e) => last = e,
            }
        }
        Err(last)
    }

    fn send(&mut self, op: u32, payload: &Value) -> io::Result<()> {
        let data = serde_json::to_vec(payload)?;
        let mut frame = Vec::with_capacity(8 + data.len());
        frame.extend_from_slice(&op.to_le_bytes());
        frame.extend_from_slice(&(data.len() as u32).to_le_bytes());
        frame.extend_from_slice(&data);
        self.pipe.write_all(&frame)?;
        self.pipe.flush()
    }

    fn recv(&mut self) -> io::Result<Value> {
        let mut header = [0u8; 8];
        self.pipe.read_exact(&mut header)?;
        let len = u32::from_le_bytes([header[4], header[5], header[6], header[7]]) as usize;
        let mut buf = vec![0u8; len];
        self.pipe.read_exact(&mut buf)?;
        Ok(serde_json::from_slice(&buf)?)
    }

    fn set_activity(&mut self, activity: Value) -> io::Result<()> {
        self.nonce += 1;
        self.send(
            OP_FRAME,
            &json!({
                "cmd": "SET_ACTIVITY",
                "args": { "pid": std::process::id(), "activity": activity },
                "nonce": self.nonce.to_string(),
            }),
        )?;
        let reply = self.recv()?;
        if reply.get("evt").and_then(Value::as_str) == Some("ERROR") {
            let message = reply["data"]["message"].as_str().unwrap_or("discord rejected the activity");
            return Err(io::Error::new(io::ErrorKind::Other, message.to_string()));
        }
        Ok(())
    }
}

fn apply(discord: &mut Option<Discord>, activity: Value) -> io::Result<()> {
    if let Some(d) = discord.as_mut() {
        if d.set_activity(activity.clone()).is_ok() {
            return Ok(());
        }
    }
    let mut fresh = Discord::connect()?;
    let result = fresh.set_activity(activity);
    *discord = Some(fresh);
    result
}

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
    let mut discord: Option<Discord> = None;

    while let Some(message) = read_message(&mut stdin)? {
        let result = match message.get("type").and_then(Value::as_str) {
            Some("ping") => Ok(()),
            Some("activity") => apply(&mut discord, message["activity"].clone()),
            Some("clear") => apply(&mut discord, Value::Null),
            _ => Err(io::Error::new(io::ErrorKind::InvalidInput, "unknown message type")),
        };
        let reply = match result {
            Ok(()) => json!({ "type": "ok" }),
            Err(e) => json!({ "type": "error", "error": e.to_string() }),
        };
        write_message(&mut stdout, &reply)?;
    }

    Ok(())
}
