import { useState } from 'react';
import { Plus, Clock, Flag, Trash2, Edit2, Check } from 'lucide-react';
import { Task } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function TaskManager() {
  const [tasks, setTasks] = useLocalStorageWithDates<Task[]>('tasks', [], ['dueDate', 'createdAt', 'updatedAt']);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    category: 'Personal' as Task['category'],
    priority: 'Medium' as Task['priority'],
    dueDate: '',
  });

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      category: newTask.category,
      priority: newTask.priority,
      completed: false,
      status: 'todo',
      dueDate: newTask.dueDate ? new Date(newTask.dueDate) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTasks(prev => [...prev, task]);
    setNewTask({
      title: '',
      description: '',
      category: 'Personal',
      priority: 'Medium',
      dueDate: '',
    });
    setIsAddingTask(false);
  };

  const toggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed, status: !task.completed ? 'completed' : 'todo', updatedAt: new Date() }
          : task
      )
    );
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const updateTask = () => {
    if (!editingTask || !editingTask.title.trim()) return;

    setTasks(prev =>
      prev.map(task =>
        task.id === editingTask.id
          ? { ...editingTask, updatedAt: new Date() }
          : task
      )
    );
    setEditingTask(null);
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Tasks</h2>
        <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus size={16} className="mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newTask.category} onValueChange={(value: Task['category']) => setNewTask(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Learning">Learning</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newTask.priority} onValueChange={(value: Task['priority']) => setNewTask(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingTask(false)}>
                  Cancel
                </Button>
                <Button onClick={addTask}>Add Task</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Today's Tasks Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Today's Tasks</h3>
          <p className="text-2xl font-bold text-blue-600">
            {completedTasks.length} of {tasks.length} completed
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Completion Rate</h3>
          <p className="text-2xl font-bold text-green-600">
            {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Incomplete Tasks */}
      {incompleteTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Active Tasks</h3>
          <div className="space-y-3">
            {incompleteTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={setEditingTask}
                onDelete={deleteTask}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Completed Tasks</h3>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={setEditingTask}
                onDelete={deleteTask}
                getPriorityColor={getPriorityColor}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ''}
                  onChange={(e) => setEditingTask(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select 
                    value={editingTask.category} 
                    onValueChange={(value: Task['category']) => setEditingTask(prev => prev ? { ...prev, category: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Learning">Learning</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={editingTask.priority} 
                    onValueChange={(value: Task['priority']) => setEditingTask(prev => prev ? { ...prev, priority: value } : null)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTask(null)}>
                  Cancel
                </Button>
                <Button onClick={updateTask}>Update Task</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskItem({ 
  task, 
  onToggle, 
  onEdit, 
  onDelete, 
  getPriorityColor 
}: { 
  task: Task;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  getPriorityColor: (priority: Task['priority']) => string;
}) {
  return (
    <div className={cn(
      "bg-white rounded-lg p-4 shadow-sm border border-gray-100",
      task.completed && "opacity-75"
    )}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task.id)}
          className={cn(
            "mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
            task.completed
              ? "bg-green-500 border-green-500 text-white"
              : "border-gray-300 hover:border-green-500"
          )}
        >
          {task.completed && <Check size={12} />}
        </button>
        
        <div className="flex-1">
          <h4 className={cn(
            "font-medium",
            task.completed ? "line-through text-gray-500" : "text-gray-800"
          )}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="bg-gray-100 px-2 py-1 rounded">{task.category}</span>
            <span className={cn("flex items-center gap-1", getPriorityColor(task.priority))}>
              <Flag size={12} />
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {format(task.dueDate, 'MMM d')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Edit2 size={14} className="text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
