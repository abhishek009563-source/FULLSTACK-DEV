// Environment verification script for Kanban Task Manager
console.log("Running Kanban Board startup checks...");

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const tasksFile = path.join(dataDir, 'tasks.json');

console.log(`Checking data directory: ${dataDir}`);
if (fs.existsSync(dataDir)) {
  console.log("✅ Data directory exists.");
} else {
  console.log("❌ Data directory is missing.");
}

console.log(`Checking tasks file: ${tasksFile}`);
if (fs.existsSync(tasksFile)) {
  const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
  console.log(`✅ Tasks file exists. Found ${tasks.length} tasks.`);
} else {
  console.log("❌ Tasks file is missing.");
}
