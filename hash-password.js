const crypto = require('crypto');
const { promisify } = require('util');

async function hashPassword(password) {
  const scryptAsync = promisify(crypto.scrypt);
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function main() {
  const hashedPassword = await hashPassword('sds#website');
  console.log(hashedPassword);
}

main();