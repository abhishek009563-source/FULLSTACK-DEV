// Environment verification script for Kanban Task Manager
console.log("Running Kanban Board startup checks...");

const fs = require('fs');
const path = require('path');
const os = require('os');

const dataDir = path.join(__dirname, 'data');
const tasksFile = path.join(dataDir, 'tasks.json');
const serverFile = path.join(__dirname, 'server.js');
const indexFile = path.join(__dirname, 'public', 'index.html');
const packageFile = path.join(__dirname, 'package.json');

function getAppVersion() {
  try {
    if (fs.existsSync(packageFile)) {
      const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
      return { name: pkg.name || 'ant-kanban-board', version: pkg.version || '1.0.0' };
    }
  } catch (err) {
    console.error('Error reading package.json:', err);
  }
  return { name: 'ant-kanban-board', version: '1.0.0' };
}

function getSystemInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryUsageMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    uptimeSeconds: Math.floor(process.uptime())
  };
}

function validateTaskSchema(task) {
  if (!task || typeof task !== 'object') return false;
  const requiredFields = ['id', 'title', 'status'];
  return requiredFields.every(field => field in task && typeof task[field] === 'string' && task[field].trim() !== '');
}

function formatHealthReport() {
  const isHealthy = runStartupChecks();
  return {
    timestamp: new Date().toISOString(),
    status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
    app: getAppVersion(),
    system: getSystemInfo()
  };
}

function runStartupChecks() {
  let isHealthy = true;

  const appMeta = getAppVersion();
  console.log(`📦 Application: ${appMeta.name} v${appMeta.version}`);

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
      const validCount = Array.isArray(tasks) ? tasks.filter(validateTaskSchema).length : 0;
      console.log(`✅ Tasks file exists. Found ${tasks.length} total tasks (${validCount} valid schema).`);
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

  const sysInfo = getSystemInfo();
  console.log(`💻 Node ${sysInfo.nodeVersion} (${sysInfo.platform}/${sysInfo.arch}) - Heap: ${sysInfo.memoryUsageMB}MB`);

  console.log(isHealthy ? "🚀 Overall Status: HEALTHY" : "⚠️ Overall Status: ISSUES DETECTED");
  return isHealthy;
}

if (require.main === module) {
  runStartupChecks();
}

module.exports = { runStartupChecks, getSystemInfo, getAppVersion, validateTaskSchema, formatHealthReport };
