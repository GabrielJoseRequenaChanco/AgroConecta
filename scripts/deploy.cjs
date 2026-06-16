const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function runCommand(command) {
  console.log(`\n🚀 Running: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    process.exit(1);
  }
}

// 1. Clean directories
const wranglerDir = path.join(__dirname, "..", ".wrangler");
const wranglerJsonFile = path.join(__dirname, "..", "dist", "server", "wrangler.json");

console.log("🧹 Cleaning old builds...");

if (fs.existsSync(wranglerDir)) {
  try {
    fs.rmSync(wranglerDir, { recursive: true, force: true });
    console.log("  ✓ Deleted .wrangler cache");
  } catch (err) {
    console.warn("  ⚠ Could not delete .wrangler cache: " + err.message);
  }
}

if (fs.existsSync(wranglerJsonFile)) {
  try {
    fs.unlinkSync(wranglerJsonFile);
    console.log("  ✓ Deleted old wrangler.json");
  } catch (err) {
    console.warn("  ⚠ Could not delete wrangler.json: " + err.message);
  }
}

// 2. Build Vite bundle
runCommand("npm run build");

// 3. Deploy to Cloudflare
runCommand("npx wrangler deploy ./dist/server/index.js --name cybermarket --assets ./dist/client");

console.log("\n✅ Deployment completed successfully!");
