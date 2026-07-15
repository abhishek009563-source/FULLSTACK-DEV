// Application State
let tasks = [];
let activeFilters = {
  search: '',
  category: 'all',
  priority: 'all'
};

// DOM Elements
const listTodo = document.getElementById('list-todo');
const listInProgress = document.getElementById('list-inprogress');
const listDone = document.getElementById('list-done');

const statTotal = document.getElementById('stat-total');
const statProgress = document.getElementById('stat-progress');
const statCompletion = document.getElementById('stat-completion');
const statHighPriority = document.getElementById('stat-high-priority');

const countTodo = document.getElementById('count-todo');
const countInProgress = document.getElementById('count-inprogress');
const countDone = document.getElementById('count-done');

const filterSearch = document.getElementById('filter-search');
const filterCategory = document.getElementById('filter-category');
const filterPriority = document.getElementById('filter-priority');
const btnResetFilters = document.getElementById('btn-reset-filters');

const btnNewTask = document.getElementById('btn-new-task');
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const modalTitle = document.getElementById('modal-title');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancelModal = document.getElementById('btn-cancel-modal');
const btnDeleteTask = document.getElementById('btn-delete-task');

// Form Inputs
const inputTaskId = document.getElementById('task-id');
const inputTaskTitle = document.getElementById('task-title-input');
const inputTaskDesc = document.getElementById('task-desc-input');
const inputTaskCategory = document.getElementById('task-category-input');
const inputTaskPriority = document.getElementById('task-priority-input');
const inputTaskDue = document.getElementById('task-due-input');
const inputTaskStatus = document.getElementById('task-status-input');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  fetchTasks();
  setupEventListeners();
  setupDragAndDrop();
});

// Event Listeners Setup
function setupEventListeners() {
  // Modal toggle
  btnNewTask.addEventListener('click', () => openModal());
  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  
  // Close modal when clicking overlay
  taskModal.addEventListener('click', (e) => {
    if (e.target === taskModal) closeModal();
  });

  // Submit and Delete handlers
  taskForm.addEventListener('submit', handleFormSubmit);
  btnDeleteTask.addEventListener('click', handleDeleteTask);

  // Filter events
  filterSearch.addEventListener('input', (e) => {
    activeFilters.search = e.target.value.toLowerCase().trim();
    renderBoard();
  });

  filterCategory.addEventListener('change', (e) => {
    activeFilters.category = e.target.value;
    renderBoard();
  });

  filterPriority.addEventListener('change', (e) => {
    activeFilters.priority = e.target.value;
    renderBoard();
  });

  btnResetFilters.addEventListener('click', resetFilters);
}

// Drag and Drop Logic
function setupDragAndDrop() {
  const lists = [listTodo, listInProgress, listDone];

  lists.forEach(list => {
    list.addEventListener('dragover', (e) => {
      e.preventDefault();
      list.classList.add('drag-over');
    });

    list.addEventListener('dragleave', () => {
      list.classList.remove('drag-over');
    });

    list.addEventListener('drop', async (e) => {
      e.preventDefault();
      list.classList.remove('drag-over');
      
      const taskId = e.dataTransfer.getData('text/plain');
      const targetColumn = list.closest('.kanban-column');
      const newStatus = targetColumn.dataset.status;

      if (taskId && newStatus) {
        // Move visually first for snappy UI (optimistic update)
        const task = tasks.find(t => t.id === taskId);
        if (task && task.status !== newStatus) {
          const oldStatus = task.status;
          task.status = newStatus;
          renderBoard();

          try {
            const response = await fetch(`/api/tasks/${taskId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
              throw new Error('Failed to update status on server');
            }
            
            // Sync with backend response
            const updatedTask = await response.json();
            const index = tasks.findIndex(t => t.id === taskId);
            tasks[index] = updatedTask;
            updateStats();
          } catch (err) {
            console.error('Failed to save drag/drop changes, reverting...', err);
            // Revert changes on error
            task.status = oldStatus;
            renderBoard();
          }
        }
      }
    });
  });
}

// Fetch tasks from API
async function fetchTasks() {
  try {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
    populateCategoryFilter();
    renderBoard();
  } catch (err) {
    console.error('Error loading tasks from server:', err);
  }
}

// Populate the Category dropdown filter dynamically
function populateCategoryFilter() {
  const categories = [...new Set(tasks.map(t => t.category).filter(Boolean))];
  
  // Keep original value to restore it
  const currentSelection = filterCategory.value;
  
  filterCategory.innerHTML = '<option value="all">All Categories</option>';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    filterCategory.appendChild(option);
  });

  // Try to restore selection
  if (categories.includes(currentSelection)) {
    filterCategory.value = currentSelection;
  } else {
    filterCategory.value = 'all';
    activeFilters.category = 'all';
  }
}

// Reset filters
function resetFilters() {
  filterSearch.value = '';
  filterCategory.value = 'all';
  filterPriority.value = 'all';
  activeFilters = { search: '', category: 'all', priority: 'all' };
  renderBoard();
}

// Open Modal Dialog (Create/Edit modes)
function openModal(task = null) {
  taskModal.classList.add('active');
  
  if (task) {
    // Edit Mode
    modalTitle.textContent = 'Edit Task';
    btnDeleteTask.classList.remove('hidden');
    
    inputTaskId.value = task.id;
    inputTaskTitle.value = task.title;
    inputTaskDesc.value = task.description;
    inputTaskCategory.value = task.category;
    inputTaskPriority.value = task.priority;
    inputTaskDue.value = task.dueDate || '';
    inputTaskStatus.value = task.status;
  } else {
    // Create Mode
    modalTitle.textContent = 'Create New Task';
    btnDeleteTask.classList.add('hidden');
    taskForm.reset();
    inputTaskId.value = '';
    inputTaskStatus.value = 'todo'; // default to todo column
    inputTaskPriority.value = 'medium'; // default to medium
  }
}

// Close Modal Dialog
function closeModal() {
  taskModal.classList.remove('active');
  taskForm.reset();
  inputTaskId.value = '';
}

// Render Task Lists and Columns
function renderBoard() {
  // Clear lists
  listTodo.innerHTML = '';
  listInProgress.innerHTML = '';
  listDone.innerHTML = '';

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(activeFilters.search) || 
                          task.description.toLowerCase().includes(activeFilters.search);
    const matchesCategory = activeFilters.category === 'all' || task.category === activeFilters.category;
    const matchesPriority = activeFilters.priority === 'all' || task.priority === activeFilters.priority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  let counts = { todo: 0, inprogress: 0, done: 0 };

  // Render cards
  filteredTasks.forEach(task => {
    const card = createTaskCard(task);
    counts[task.status]++;

    if (task.status === 'todo') {
      listTodo.appendChild(card);
    } else if (task.status === 'inprogress') {
      listInProgress.appendChild(card);
    } else if (task.status === 'done') {
      listDone.appendChild(card);
    }
  });

  // Update headers count badges
  countTodo.textContent = counts.todo;
  countInProgress.textContent = counts.inprogress;
  countDone.textContent = counts.done;

  updateStats();
}

// Create Task Card DOM Element
function createTaskCard(task) {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.draggable = true;
  card.dataset.id = task.id;

  // Overdue check
  let isOverdue = false;
  let formattedDate = '';
  if (task.dueDate && task.status !== 'done') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    isOverdue = due < today;
    formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } else if (task.dueDate) {
    formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  card.innerHTML = `
    <div class="task-card-header">
      <h4>${escapeHTML(task.title)}</h4>
      <span class="priority-badge priority-${task.priority}">${task.priority}</span>
    </div>
    ${task.description ? `<p class="task-card-body">${escapeHTML(task.description)}</p>` : ''}
    <div class="task-card-footer">
      <span class="category-tag">${escapeHTML(task.category || 'General')}</span>
      ${task.dueDate ? `
        <div class="due-date ${isOverdue ? 'overdue' : ''}" title="${isOverdue ? 'Overdue!' : 'Due Date'}">
          <span class="material-symbols-outlined">schedule</span>
          <span>${formattedDate}</span>
        </div>
      ` : ''}
    </div>
  `;

  // HTML5 Drag and Drop events
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    card.style.opacity = '0.4';
  });

  card.addEventListener('dragend', () => {
    card.style.opacity = '1';
  });

  // Edit on click
  card.addEventListener('click', (e) => {
    // Avoid modal triggers on child interaction if needed (e.g. if we add specific item links)
    openModal(task);
  });

  return card;
}

// Update Header Statistics Dashboard
function updateStats() {
  const total = tasks.length;
  const inProgress = tasks.filter(t => t.status === 'inprogress').length;
  const completed = tasks.filter(t => t.status === 'done').length;
  const highPriority = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  statTotal.textContent = total;
  statProgress.textContent = inProgress;
  statCompletion.textContent = `${completionRate}%`;
  statHighPriority.textContent = highPriority;
}

// Form Submission (Create or Update Task)
async function handleFormSubmit(e) {
  e.preventDefault();

  const taskId = inputTaskId.value;
  const taskData = {
    title: inputTaskTitle.value.trim(),
    description: inputTaskDesc.value.trim(),
    category: inputTaskCategory.value.trim() || 'General',
    priority: inputTaskPriority.value,
    dueDate: inputTaskDue.value,
    status: inputTaskStatus.value
  };

  if (!taskData.title) return;

  try {
    let url = '/api/tasks';
    let method = 'POST';

    if (taskId) {
      // Editing Mode
      url = `/api/tasks/${taskId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error('Failed to save task');
    }

    const savedTask = await response.json();

    if (taskId) {
      // Update local array
      const idx = tasks.findIndex(t => t.id === taskId);
      tasks[idx] = savedTask;
    } else {
      // Push new task
      tasks.push(savedTask);
    }

    closeModal();
    populateCategoryFilter();
    renderBoard();

  } catch (err) {
    console.error('Error submitting form:', err);
    alert('An error occurred while saving the task. Please try again.');
  }
}

// Delete Task Handler
async function handleDeleteTask() {
  const taskId = inputTaskId.value;
  if (!taskId) return;

  if (confirm('Are you sure you want to delete this task?')) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      tasks = tasks.filter(t => t.id !== taskId);
      closeModal();
      populateCategoryFilter();
      renderBoard();

    } catch (err) {
      console.error('Error deleting task:', err);
      alert('An error occurred while deleting the task. Please try again.');
    }
  }
}

// Helper to escape HTML characters (XSS Prevention)
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
