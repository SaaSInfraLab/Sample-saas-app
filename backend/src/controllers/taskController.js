const Task = require('../models/Task');

/**
 * Get all tasks for the authenticated tenant
 */
async function getTasks(req, res) {
  try {
    const filters = {
      status: req.query.status,
      assignee: req.query.assignee,
    };

    const tasks = await Task.findAll(req.queryInTenant, filters);
    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

/**
 * Get task by ID
 */
async function getTaskById(req, res) {
  try {
    const { id } = req.params;
    const task = await Task.findById(req.queryInTenant, id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
}

/**
 * Create new task
 */
async function createTask(req, res) {
  try {
    const taskData = {
      ...req.body,
      created_by: req.user.userId,
    };

    const task = await Task.create(req.queryInTenant, taskData);
    res.status(201).json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
}

/**
 * Update task
 */
async function updateTask(req, res) {
  try {
    const { id } = req.params;
    
    // Verify task exists and belongs to tenant
    const existingTask = await Task.findById(req.queryInTenant, id);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = await Task.update(req.queryInTenant, id, req.body);
    res.json({ task });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
}

/**
 * Delete task
 */
async function deleteTask(req, res) {
  try {
    const { id } = req.params;
    
    const task = await Task.delete(req.queryInTenant, id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully', task });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

/**
 * Get task statistics
 */
async function getTaskStatistics(req, res) {
  try {
    const stats = await Task.getStatistics(req.queryInTenant);
    res.json({ statistics: stats });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getTaskStatistics,
};

