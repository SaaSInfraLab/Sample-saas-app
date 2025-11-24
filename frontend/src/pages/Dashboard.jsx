import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { tasksAPI, tenantAPI } from '../services/api';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import ResourceUsage from '../components/ResourceUsage';
import './Dashboard.css';

function Dashboard() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery('tasks', tasksAPI.getAll);
  const { data: statistics } = useQuery('statistics', tasksAPI.getStatistics);
  const { data: tenantUsage } = useQuery('tenantUsage', tenantAPI.getUsage);

  const createMutation = useMutation(tasksAPI.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
      queryClient.invalidateQueries('statistics');
      setShowForm(false);
    },
  });

  const updateMutation = useMutation(
    ({ id, data }) => tasksAPI.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('statistics');
        setShowForm(false);
        setEditingTask(null);
      },
    }
  );

  const deleteMutation = useMutation(tasksAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('tasks');
      queryClient.invalidateQueries('statistics');
    },
  });

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (taskData) => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: taskData });
    } else {
      createMutation.mutate(taskData);
    }
  };

  if (isLoading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Task Dashboard</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingTask(null);
          }}
          className="btn btn-primary"
        >
          + New Task
        </button>
      </div>

      {statistics && (
        <div className="statistics">
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p className="stat-number">{statistics.data.statistics.total_tasks}</p>
          </div>
          <div className="stat-card">
            <h3>To Do</h3>
            <p className="stat-number">{statistics.data.statistics.todo_count}</p>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <p className="stat-number">
              {statistics.data.statistics.in_progress_count}
            </p>
          </div>
          <div className="stat-card">
            <h3>Done</h3>
            <p className="stat-number">{statistics.data.statistics.done_count}</p>
          </div>
        </div>
      )}

      {tenantUsage && <ResourceUsage usage={tenantUsage.data.usage} />}

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}

      <TaskList
        tasks={tasks?.data.tasks || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}

export default Dashboard;

