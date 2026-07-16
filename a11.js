// A11y / general utilities for Kanban Board
console.log("a11 utility module loaded successfully");

module.exports = {
  logStatus: (status) => {
    console.log(`[Kanban Board] Status updated: ${status}`);
  }
};
