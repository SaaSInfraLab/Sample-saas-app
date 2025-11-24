import './TaskList.css';

function TaskList({ tasks, onEdit, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="card">
        <p>No tasks yet. Create your first task!</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return '#ffc107';
      case 'in_progress':
        return '#17a2b8';
      case 'done':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="task-list">
      {tasks.map((task) => (
        <div key={task.id} className="task-card">
          <div className="task-header">
            <h3>{task.title}</h3>
            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(task.status) }}
            >
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {task.description && (
            <p className="task-description">{task.description}</p>
          )}
          <div className="task-meta">
            {task.assignee && (
              <span className="task-assignee">Assigned to: {task.assignee}</span>
            )}
            {task.due_date && (
              <span className="task-due">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="task-actions">
            <button
              onClick={() => onEdit(task)}
              className="btn btn-primary btn-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="btn btn-danger btn-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskList;

