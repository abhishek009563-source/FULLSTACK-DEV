const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tasks.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(DATA_FILE)) {
  const initialTasks = [
    {
      id: "1",
      title: "Welcome to your Kanban Board! 🚀",
      description: "This is a card. You can edit this task, change its priority, move it to another column, or delete it.",
      status: "todo",
      priority: "medium",
      category: "Work",
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days from now
      createdAt: new Date().toISOString()
    },
    {
      id: "2",
      title: "Develop Backend API",
      description: "Build Express endpoints for creating, reading, updating, and deleting tasks.",
      status: "inprogress",
      priority: "high",
      category: "Development",
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    },
    {
      id: "3",
      title: "Design Premium UI Layout",
      description: "Create an attractive Dark Theme glassmorphic interface with fluid transitions.",
      status: "done",
      priority: "high",
      category: "Design",
      dueDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
  ];
  fs.writeFileSync(DATA_FILE, JSON.stringify(initialTasks, null, 2), 'utf8');
}

// Helper to read tasks
function readTasks() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading task file:', err);
    return [];
  }
}

// Helper to write tasks
function writeTasks(tasks) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing to task file:', err);
  }
}

// REST API Endpoints

// 1. Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json(readTasks());
});

// 2. Create a task
app.post('/api/tasks', (req, res) => {
  const { title, description, priority, category, dueDate, status } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title,
    description: description || '',
    priority: priority || 'medium',
    category: category || 'General',
    dueDate: dueDate || '',
    status: status || 'todo',
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});

// 3. Update a task
app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, priority, category, dueDate, status } = req.body;
  
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updatedTask = {
    ...tasks[taskIndex],
    title: title !== undefined ? title : tasks[taskIndex].title,
    description: description !== undefined ? description : tasks[taskIndex].description,
    priority: priority !== undefined ? priority : tasks[taskIndex].priority,
    category: category !== undefined ? category : tasks[taskIndex].category,
    dueDate: dueDate !== undefined ? dueDate : tasks[taskIndex].dueDate,
    status: status !== undefined ? status : tasks[taskIndex].status,
    updatedAt: new Date().toISOString()
  };

  tasks[taskIndex] = updatedTask;
  writeTasks(tasks);
  res.json(updatedTask);
});

// 4. Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const tasks = readTasks();
  const filteredTasks = tasks.filter(t => t.id !== id);

  if (tasks.length === filteredTasks.length) {
    return res.status(404).json({ error: 'Task not found' });
  }

  writeTasks(filteredTasks);
  res.json({ message: 'Task deleted successfully', id });
});

// Catch-all route to serve the client app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
