const crypto = require("crypto");

const ALGORITHM = "aes-256-cbc";
const KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || "default-key-change-me", "salt", 32);

// ─── Encrypt a string ─────────────────────────────────────────
const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
};

// ─── Decrypt a string ─────────────────────────────────────────
const decrypt = (text) => {
  try {
    const [ivHex, encrypted] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return text; // return as-is if already plain
  }
};

module.exports = { encrypt, decrypt };