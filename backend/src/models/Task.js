/**
 * Task Model
 * Handles all database operations for tasks within a tenant schema
 */

class Task {
  /**
   * Get all tasks for a tenant
   */
  static async findAll(tenantQuery, filters = {}) {
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.assignee) {
      query += ` AND assignee = $${paramIndex}`;
      params.push(filters.assignee);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await tenantQuery(query, params);
    return result.rows;
  }

  /**
   * Get task by ID
   */
  static async findById(tenantQuery, taskId) {
    const query = 'SELECT * FROM tasks WHERE id = $1';
    const result = await tenantQuery(query, [taskId]);
    return result.rows[0] || null;
  }

  /**
   * Create new task
   */
  static async create(tenantQuery, taskData) {
    const {
      title,
      description,
      status = 'todo',
      assignee = null,
      due_date = null,
      created_by,
    } = taskData;

    const query = `
      INSERT INTO tasks (title, description, status, assignee, due_date, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;

    const params = [title, description, status, assignee, due_date, created_by];
    const result = await tenantQuery(query, params);
    return result.rows[0];
  }

  /**
   * Update task
   */
  static async update(tenantQuery, taskId, taskData) {
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (taskData.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(taskData.title);
      paramIndex++;
    }

    if (taskData.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(taskData.description);
      paramIndex++;
    }

    if (taskData.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(taskData.status);
      paramIndex++;
    }

    if (taskData.assignee !== undefined) {
      updates.push(`assignee = $${paramIndex}`);
      params.push(taskData.assignee);
      paramIndex++;
    }

    if (taskData.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(taskData.due_date);
      paramIndex++;
    }

    if (updates.length === 0) {
      return await this.findById(tenantQuery, taskId);
    }

    updates.push(`updated_at = NOW()`);
    params.push(taskId);

    const query = `
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await tenantQuery(query, params);
    return result.rows[0] || null;
  }

  /**
   * Delete task
   */
  static async delete(tenantQuery, taskId) {
    const query = 'DELETE FROM tasks WHERE id = $1 RETURNING *';
    const result = await tenantQuery(query, [taskId]);
    return result.rows[0] || null;
  }

  /**
   * Get task statistics for a tenant
   */
  static async getStatistics(tenantQuery) {
    const query = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(*) FILTER (WHERE status = 'todo') as todo_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'done') as done_count
      FROM tasks
    `;

    const result = await tenantQuery(query);
    return result.rows[0];
  }
}

module.exports = Task;

