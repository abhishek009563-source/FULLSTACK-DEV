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
  }
};
