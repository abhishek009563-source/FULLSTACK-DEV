// MIT License / helper module for task categorization
console.log("mit module initialized");

module.exports = {
  getCategoryColor: (category) => {
    switch (category.toLowerCase()) {
      case 'design': return '#e11d48'; // Rose
      case 'development': return '#2563eb'; // Blue
      case 'work': return '#16a34a'; // Green
      default: return '#4b5563'; // Gray
    }
  },
  getPriorityColor: (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#dc2626'; // Red
      case 'medium': return '#d97706'; // Amber
      case 'low': return '#059669'; // Emerald
      default: return '#6b7280'; // Gray
    }
  },
  formatDueDate: (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },
  truncateText: (str, maxLength = 50) => {
    if (!str || str.length <= maxLength) return str || '';
    return str.substring(0, maxLength) + '...';
  }
};
