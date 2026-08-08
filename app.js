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

function getTaskStatistics() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const stats = { total: tasks.length, todo: 0, inprogress: 0, done: 0, unknown: 0 };
        tasks.forEach(task => {
          if (task && task.status && Object.prototype.hasOwnProperty.call(stats, task.status)) {
            stats[task.status]++;
          } else {
            stats.unknown++;
          }
        });
        return stats;
      }
    }
  } catch (err) {
    console.error('Error calculating task statistics:', err);
  }
  return { total: 0, todo: 0, inprogress: 0, done: 0, unknown: 0 };
}

function getTaskPriorityBreakdown() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const priorityStats = { high: 0, medium: 0, low: 0, unspecified: 0 };
        tasks.forEach(task => {
          if (task && task.priority && Object.prototype.hasOwnProperty.call(priorityStats, task.priority)) {
            priorityStats[task.priority]++;
          } else {
            priorityStats.unspecified++;
          }
        });
        return priorityStats;
      }
    }
  } catch (err) {
    console.error('Error calculating task priority breakdown:', err);
  }
  return { high: 0, medium: 0, low: 0, unspecified: 0 };
}

function getTaskCategoryBreakdown() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const categoryStats = {};
        tasks.forEach(task => {
          const category = (task && typeof task.category === 'string' && task.category.trim()) ? task.category.trim() : 'Uncategorized';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        return categoryStats;
      }
    }
  } catch (err) {
    console.error('Error calculating task category breakdown:', err);
  }
  return {};
}

function getOverdueTasksSummary() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const today = new Date().toISOString().split('T')[0];
        const overdue = tasks.filter(task => task && task.status !== 'done' && task.dueDate && task.dueDate < today);
        return {
          count: overdue.length,
          taskIds: overdue.map(t => t.id)
        };
      }
    }
  } catch (err) {
    console.error('Error calculating overdue tasks summary:', err);
  }
  return { count: 0, taskIds: [] };
}

function getTaskCompletionRate() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks) && tasks.length > 0) {
        const doneCount = tasks.filter(task => task && task.status === 'done').length;
        const ratePercentage = Math.round((doneCount / tasks.length) * 100);
        return {
          total: tasks.length,
          completed: doneCount,
          ratePercentage
        };
      }
    }
  } catch (err) {
    console.error('Error calculating task completion rate:', err);
  }
  return { total: 0, completed: 0, ratePercentage: 0 };
}

function getUpcomingTasksSummary(daysAhead = 7) {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const today = new Date().toISOString().split('T')[0];
        const futureDate = new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];
        const upcoming = tasks.filter(task => task && task.status !== 'done' && task.dueDate && task.dueDate >= today && task.dueDate <= futureDate);
        return {
          count: upcoming.length,
          daysAhead,
          taskIds: upcoming.map(t => t.id)
        };
      }
    }
  } catch (err) {
    console.error('Error calculating upcoming tasks summary:', err);
  }
  return { count: 0, daysAhead, taskIds: [] };
}

function getTaskAgeDistribution() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const now = Date.now();
        const distribution = { new: 0, recent: 0, aging: 0, unspecified: 0 };
        tasks.forEach(task => {
          if (task && task.status !== 'done') {
            if (task.createdAt) {
              const ageMs = now - new Date(task.createdAt).getTime();
              const ageDays = ageMs / (1000 * 60 * 60 * 24);
              if (ageDays < 1) distribution.new++;
              else if (ageDays <= 7) distribution.recent++;
              else distribution.aging++;
            } else {
              distribution.unspecified++;
            }
          }
        });
        return distribution;
      }
    }
  } catch (err) {
    console.error('Error calculating task age distribution:', err);
  }
  return { new: 0, recent: 0, aging: 0, unspecified: 0 };
}

function getTaskDueDateCoverage() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks) && tasks.length > 0) {
        const withDueDate = tasks.filter(task => task && task.dueDate && task.dueDate.trim() !== '').length;
        const coveragePercentage = Math.round((withDueDate / tasks.length) * 100);
        return {
          total: tasks.length,
          withDueDate,
          withoutDueDate: tasks.length - withDueDate,
          coveragePercentage
        };
      }
    }
  } catch (err) {
    console.error('Error calculating task due date coverage:', err);
  }
  return { total: 0, withDueDate: 0, withoutDueDate: 0, coveragePercentage: 0 };
}

function getHighPriorityTasksSummary() {
  try {
    if (fs.existsSync(tasksFile)) {
      const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      if (Array.isArray(tasks)) {
        const highPriorityActive = tasks.filter(task => task && task.priority === 'high' && task.status !== 'done');
        return {
          count: highPriorityActive.length,
          taskIds: highPriorityActive.map(t => t.id)
        };
      }
    }
  } catch (err) {
    console.error('Error calculating high priority tasks summary:', err);
  }
  return { count: 0, taskIds: [] };
}

function formatHealthReport() {
  const isHealthy = runStartupChecks();
  return {
    timestamp: new Date().toISOString(),
    status: isHealthy ? 'HEALTHY' : 'UNHEALTHY',
    app: getAppVersion(),
    system: getSystemInfo(),
    tasks: getTaskStatistics(),
    priorities: getTaskPriorityBreakdown(),
    categories: getTaskCategoryBreakdown(),
    overdue: getOverdueTasksSummary(),
    completionRate: getTaskCompletionRate(),
    upcoming: getUpcomingTasksSummary(),
    ageDistribution: getTaskAgeDistribution(),
    dueDateCoverage: getTaskDueDateCoverage(),
    highPriorityActive: getHighPriorityTasksSummary()
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
      const taskStats = getTaskStatistics();
      console.log(`📊 Task Metrics: ${taskStats.total} total (${taskStats.todo} todo, ${taskStats.inprogress} in-progress, ${taskStats.done} done)`);
      const priorityStats = getTaskPriorityBreakdown();
      console.log(`🎯 Priority Breakdown: ${priorityStats.high} high, ${priorityStats.medium} medium, ${priorityStats.low} low`);
      const categoryStats = getTaskCategoryBreakdown();
      const categoriesSummary = Object.entries(categoryStats).map(([cat, count]) => `${cat}: ${count}`).join(', ');
      console.log(`🏷️ Category Breakdown: ${categoriesSummary || 'None'}`);
      const overdueStats = getOverdueTasksSummary();
      console.log(`⏰ Overdue Tasks: ${overdueStats.count}`);
      const rateStats = getTaskCompletionRate();
      console.log(`📈 Completion Rate: ${rateStats.ratePercentage}% (${rateStats.completed}/${rateStats.total})`);
      const upcomingStats = getUpcomingTasksSummary();
      console.log(`📅 Upcoming Tasks (7 days): ${upcomingStats.count}`);
      const ageStats = getTaskAgeDistribution();
      console.log(`⏳ Active Task Age: ${ageStats.new} new (<1d), ${ageStats.recent} recent (1-7d), ${ageStats.aging} aging (>7d)`);
      const dueDateStats = getTaskDueDateCoverage();
      console.log(`📅 Due Date Coverage: ${dueDateStats.coveragePercentage}% (${dueDateStats.withDueDate}/${dueDateStats.total} tasks)`);
      const highPriorityStats = getHighPriorityTasksSummary();
      console.log(`⚡ High Priority Active Tasks: ${highPriorityStats.count}`);
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

module.exports = { runStartupChecks, getSystemInfo, getAppVersion, validateTaskSchema, formatHealthReport, getTaskStatistics, getTaskPriorityBreakdown, getTaskCategoryBreakdown, getOverdueTasksSummary, getTaskCompletionRate, getUpcomingTasksSummary, getTaskAgeDistribution, getTaskDueDateCoverage, getHighPriorityTasksSummary };



