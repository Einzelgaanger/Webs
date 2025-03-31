const crypto = require('crypto');
const readline = require('readline');

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const password = await new Promise(resolve => {
    rl.question('Enter password to hash: ', answer => {
      resolve(answer);
    });
  });

  const hashedPassword = await hashPassword(password);
  console.log('\nHashed password:');
  console.log(hashedPassword);

  rl.close();
}

// Run the main function
main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});