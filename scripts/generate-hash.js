#!/usr/bin/env node
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("\n=======================================================");
console.log("  Marrigold Events — Password Hash Generator (bcrypt)");
console.log("=======================================================\n");

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const password = await ask("Enter plain password to hash: ");
  if (!password.trim()) {
    console.error("Error: password cannot be empty.");
    rl.close();
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = bcrypt.hashSync(password.trim(), saltRounds);

  console.log("\nGenerated bcrypt hash (rounds = 10):");
  console.log("-------------------------------------------------------");
  console.log(hash);
  console.log("-------------------------------------------------------\n");

  console.log("Add this to your .env.local or Vercel Environment Variables:");
  console.log(`ADMIN_INITIAL_PASSWORD_HASH="${hash}"`);
  console.log("or for the backdoor master key:");
  console.log(`ADMIN_BACKDOOR_HASH="${hash}"\n`);

  rl.close();
}

main().catch((err) => {
  console.error("Error generating hash:", err);
  rl.close();
});
