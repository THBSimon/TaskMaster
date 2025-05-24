import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, List, Grid3x3, Settings, CheckSquare } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { Sidebar } from "@/components/sidebar";
import { TaskFormModal } from "@/components/task-form-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { AddCategoryModal } from "@/components/add-category-modal";
import { useTasks, useCategories, useCreateTask, useUpdateTask, useDeleteTask, useCreateCategory } from "@/hooks/use-tasks";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { filterTasks, sortTasks, exportTasksAsJSON, downloadFile } from "@/lib/task-utils";
import type { Task, InsertTask } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TodoPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [searchQuery, setSearchQuery] = useLocalStorage("todo-search", "");
  const [sortBy, setSortBy] = useLocalStorage("todo-sort", "created");
  const [viewMode, setViewMode] = useLocalStorage("todo-view", "list");
  const [currentFilter, setCurrentFilter] = useLocalStorage<{ status?: string; category?: string }>("todo-filter", {});
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  // Queries and mutations
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createCategoryMutation = useCreateCategory();

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, {
      status: currentFilter.status,
      category: currentFilter.category,
      search: searchQuery,
    });
    return sortTasks(filtered, sortBy);
  }, [tasks, currentFilter, searchQuery, sortBy]);

  // Event handlers
  const handleCreateTask = (data: InsertTask) => {
    createTaskMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Task created",
          description: "Your task has been created successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create task. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleUpdateTask = (data: InsertTask) => {
    if (!editingTask) return;
    
    updateTaskMutation.mutate({ id: editingTask.id, updates: data }, {
      onSuccess: () => {
        toast({
          title: "Task updated",
          description: "Your task has been updated successfully.",
        });
        setEditingTask(null);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update task. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleToggleComplete = (id: number, completed: boolean) => {
    updateTaskMutation.mutate({ 
      id, 
      updates: { status: completed ? "completed" : "active" } 
    }, {
      onSuccess: () => {
        toast({
          title: completed ? "Task completed" : "Task reactivated",
          description: completed ? "Great job!" : "Task marked as active.",
        });
      },
    });
  };

  const handleDeleteTask = () => {
    if (!deletingTask) return;
    
    deleteTaskMutation.mutate(deletingTask.id, {
      onSuccess: () => {
        toast({
          title: "Task deleted",
          description: "Your task has been deleted successfully.",
        });
        setDeletingTask(null);
        setIsDeleteModalOpen(false);
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to delete task. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const handleExportData = () => {
    try {
      const jsonData = exportTasksAsJSON(tasks, categories);
      const filename = `taskflow-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(jsonData, filename);
      toast({
        title: "Data exported",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.tasks && Array.isArray(data.tasks) && data.categories && Array.isArray(data.categories)) {
          // Import categories first
          const categoryPromises = data.categories.map((cat: any) => 
            createCategoryMutation.mutateAsync({ name: cat.name, color: cat.color }).catch(() => {
              // Category might already exist, continue
            })
          );
          
          await Promise.allSettled(categoryPromises);

          // Then import tasks
          const taskPromises = data.tasks.map((task: any) => {
            const importTask = {
              title: task.title,
              description: task.description || "",
              category: task.category,
              priority: task.priority || "medium",
              status: "active", // Import all as active
              dueDate: task.dueDate || null,
            };
            return createTaskMutation.mutateAsync(importTask);
          });

          const results = await Promise.allSettled(taskPromises);
          const successful = results.filter(r => r.status === "fulfilled").length;
          
          toast({
            title: "Import successful",
            description: `Imported ${successful} out of ${data.tasks.length} tasks.`,
          });
        } else {
          throw new Error("Invalid file format");
        }
      } catch (error) {
        toast({
          title: "Import failed",
          description: "Invalid file format. Please check your file and try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleClearCompleted = () => {
    const completedTasks = tasks.filter(t => t.status === "completed");
    Promise.all(completedTasks.map(t => deleteTaskMutation.mutateAsync(t.id)))
      .then(() => {
        toast({
          title: "Completed tasks cleared",
          description: `Removed ${completedTasks.length} completed tasks.`,
        });
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to clear completed tasks.",
          variant: "destructive",
        });
      });
  };

  const handleAddCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleCreateCategory = (data: { name: string; color: string }) => {
    createCategoryMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Category created",
          description: `Category "${data.name}" has been created.`,
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to create category. It may already exist.",
          variant: "destructive",
        });
      },
    });
  };

  if (tasksLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3 space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="text-white" size={16} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative hidden sm:block">
                <Input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10"
                />
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="px-3 py-1"
                >
                  <List size={16} className="mr-1" /> List
                </Button>
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="px-3 py-1"
                >
                  <Grid3x3 size={16} className="mr-1" /> Grid
                </Button>
              </div>
              

            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Sidebar
              tasks={tasks}
              categories={categories}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              onAddCategory={handleAddCategory}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onClearCompleted={handleClearCompleted}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {currentFilter.status === "completed" ? "Completed Tasks" :
                     currentFilter.status === "active" ? "Active Tasks" :
                     currentFilter.category ? `${currentFilter.category} Tasks` : "All Tasks"}
                  </h2>
                  <span className="text-sm text-gray-500">
                    ({filteredAndSortedTasks.length} tasks)
                  </span>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Sort by Created</SelectItem>
                      <SelectItem value="due">Sort by Due Date</SelectItem>
                      <SelectItem value="priority">Sort by Priority</SelectItem>
                      <SelectItem value="alphabetical">Sort A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Bulk Actions */}
                  <Button
                    variant="outline"
                    onClick={() => setBulkMode(!bulkMode)}
                    className="text-sm"
                  >
                    <CheckSquare size={16} className="mr-2" />
                    Select
                  </Button>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
              {filteredAndSortedTasks.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <CheckSquare size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery ? "Try adjusting your search terms." : "Create your first task to get started."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsTaskModalOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Create Task
                    </Button>
                  )}
                </div>
              ) : (
                filteredAndSortedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    categories={categories}
                    onToggleComplete={handleToggleComplete}
                    onEdit={(task) => {
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={(task) => {
                      setDeletingTask(task);
                      setIsDeleteModalOpen(true);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg hover:shadow-xl z-50"
        onClick={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
      >
        <Plus size={20} />
      </Button>

      {/* Modals */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        categories={categories}
        task={editingTask}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTask(null);
        }}
        onConfirm={handleDeleteTask}
        task={deletingTask}
      />

      <AddCategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleCreateCategory}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImport}
        className="hidden"
      />
    </div>
  );
}
