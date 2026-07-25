// Environment verification script for Kanban Task Manager
console.log("Running Kanban Board startup checks...");

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const tasksFile = path.join(dataDir, 'tasks.json');
const serverFile = path.join(__dirname, 'server.js');
const indexFile = path.join(__dirname, 'public', 'index.html');

function runStartupChecks() {
  let isHealthy = true;

  console.log(`Checking data directory: ${dataDir}`);
  if (fs.existsSync(dataDir)) {
    console.log("✅ Data directory exists.");
  } else {
    console.log("❌ Data directory is missing.");
    isHealthy = false;
  }

  console.log(`Checking tasks file: ${tasksFile}`);
  if (fs.existsSync(tasksFile)) {
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      console.log(`✅ Tasks file exists. Found ${tasks.length} tasks.`);
    } catch (e) {
      console.log("❌ Tasks file exists but has invalid JSON content.");
      isHealthy = false;
    }
  } else {
    console.log("❌ Tasks file is missing.");
    isHealthy = false;
  }

  console.log(`Checking server.js: ${serverFile}`);
  if (fs.existsSync(serverFile)) {
    console.log("✅ server.js exists.");
  } else {
    console.log("❌ server.js is missing.");
    isHealthy = false;
  }

  console.log(`Checking public/index.html: ${indexFile}`);
  if (fs.existsSync(indexFile)) {
    console.log("✅ public/index.html exists.");
  } else {
    console.log("❌ public/index.html is missing.");
    isHealthy = false;
  }

  console.log(`Checking port availability...`);
  const PORT = process.env.PORT || 3000;
  console.log(`👉 Configured PORT is ${PORT}`);

  console.log(isHealthy ? "🚀 Overall Status: HEALTHY" : "⚠️ Overall Status: ISSUES DETECTED");
  return isHealthy;
}

if (require.main === module) {
  runStartupChecks();
}

module.exports = { runStartupChecks };
