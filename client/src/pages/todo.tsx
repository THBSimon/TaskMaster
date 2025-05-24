import { useState, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, List, Grid3x3, Settings, CheckSquare, Menu, X } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { Sidebar } from "@/components/sidebar";
import { TaskFormModal } from "@/components/task-form-modal";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { AddCategoryModal } from "@/components/add-category-modal";
import { DeleteCategoryModal } from "@/components/delete-category-modal";
import { useLocalTasks } from "@/hooks/use-local-tasks";
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
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Local storage hooks
  const {
    tasks,
    categories,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    deleteCategory,
  } = useLocalTasks();

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = filterTasks(tasks, {
      search: searchQuery,
      status: currentFilter.status,
      category: currentFilter.category,
    });
    return sortTasks(filtered, sortBy);
  }, [tasks, currentFilter, searchQuery, sortBy]);

  // Event handlers
  const handleCreateTask = async (data: InsertTask) => {
    try {
      await createTask(data);
      toast({
        title: "Task created",
        description: "Your task has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (data: InsertTask) => {
    if (!editingTask) return;
    
    try {
      await updateTask(editingTask.id, data);
      toast({
        title: "Task updated",
        description: "Your task has been updated successfully.",
      });
      setEditingTask(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      await updateTask(id, { status: completed ? "completed" : "active" });
      toast({
        title: completed ? "Task completed" : "Task reactivated",
        description: completed ? "Great job!" : "Task marked as active.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;
    
    try {
      await deleteTask(deletingTask.id);
      toast({
        title: "Task deleted",
        description: "Your task has been deleted successfully.",
      });
      setDeletingTask(null);
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async (data: { name: string; color: string }) => {
    try {
      await createCategory(data);
      toast({
        title: "Category created",
        description: `Category "${data.name}" has been created.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create category. It may already exist.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    const tasksUsingCategory = tasks.filter(t => t.category === category.name);
    if (tasksUsingCategory.length > 0) {
      toast({
        title: "Cannot delete category",
        description: `"${category.name}" is being used by ${tasksUsingCategory.length} task(s). Please reassign these tasks first.`,
        variant: "destructive",
      });
      return;
    }

    setDeletingCategory(category);
    setIsDeleteCategoryModalOpen(true);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      await deleteCategory(deletingCategory.id);
      toast({
        title: "Category deleted",
        description: `Category "${deletingCategory.name}" has been deleted.`,
      });
      setIsDeleteCategoryModalOpen(false);
      setDeletingCategory(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-24 w-full" />
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
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-80 h-full bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Filters & Categories</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>
            <div className="p-4">
              <Sidebar
                tasks={tasks}
                categories={categories}
                currentFilter={currentFilter}
                onFilterChange={(filter) => {
                  setCurrentFilter(filter);
                  setIsSidebarOpen(false);
                }}
                onAddCategory={() => setIsCategoryModalOpen(true)}
                onDeleteCategory={handleDeleteCategory}
                onExportData={() => {
                  const jsonData = exportTasksAsJSON(tasks, categories);
                  downloadFile(jsonData, "tasks-backup.json");
                }}
                onImportData={() => fileInputRef.current?.click()}
                onClearCompleted={async () => {
                  const completedTasks = tasks.filter(t => t.status === "completed");
                  try {
                    await Promise.all(completedTasks.map(t => deleteTask(t.id)));
                    toast({
                      title: "Completed tasks cleared",
                      description: `Removed ${completedTasks.length} completed tasks.`,
                    });
                  } catch (error) {
                    toast({
                      title: "Error",
                      description: "Failed to clear completed tasks.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={16} className="mr-1" />
                Filter
              </Button>
              <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                <Plus size={16} />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">Date Created</SelectItem>
                  <SelectItem value="dueDate">Due Date</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
              
              <p className="text-sm text-gray-500">
                {filteredAndSortedTasks.length} tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          <div className="col-span-1">
            <Sidebar
              tasks={tasks}
              categories={categories}
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              onAddCategory={() => setIsCategoryModalOpen(true)}
              onDeleteCategory={handleDeleteCategory}
              onExportData={() => {
                const jsonData = exportTasksAsJSON(tasks, categories);
                downloadFile(jsonData, "tasks-backup.json");
              }}
              onImportData={() => fileInputRef.current?.click()}
              onClearCompleted={async () => {
                const completedTasks = tasks.filter(t => t.status === "completed");
                try {
                  await Promise.all(completedTasks.map(t => deleteTask(t.id)));
                  toast({
                    title: "Completed tasks cleared",
                    description: `Removed ${completedTasks.length} completed tasks.`,
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to clear completed tasks.",
                    variant: "destructive",
                  });
                }
              }}
            />
          </div>

          {/* Desktop Main Content */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {filteredAndSortedTasks.length} tasks
                    </p>
                  </div>
                  
                  <Button onClick={() => setIsTaskModalOpen(true)} size="sm">
                    <Plus size={16} className="mr-2" />
                    Add Task
                  </Button>
                </div>
                
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="Search tasks..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created">Date Created</SelectItem>
                      <SelectItem value="dueDate">Due Date</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex border rounded-md">
                    <Button
                      variant={viewMode === "list" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="rounded-r-none border-r"
                    >
                      <List size={16} />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="rounded-l-none"
                    >
                      <Grid3x3 size={16} />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {filteredAndSortedTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || currentFilter.status !== undefined || currentFilter.category
                        ? "Try adjusting your search or filters"
                        : "Create your first task to get started"}
                    </p>
                    <Button onClick={() => setIsTaskModalOpen(true)}>
                      <Plus size={16} className="mr-2" />
                      Add Task
                    </Button>
                  </div>
                ) : (
                  <div className={
                    viewMode === "grid" 
                      ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4"
                      : "space-y-3"
                  }>
                    {filteredAndSortedTasks.map((task) => (
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="lg:hidden">
        <div className="p-4">
          {filteredAndSortedTasks.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg">
              <CheckSquare size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-4 text-sm">
                {searchQuery || currentFilter.status !== undefined || currentFilter.category
                  ? "Try adjusting your search or filters"
                  : "Create your first task to get started"}
              </p>
              <Button onClick={() => setIsTaskModalOpen(true)}>
                <Plus size={16} className="mr-2" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTasks.map((task) => (
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
              ))}
            </div>
          )}
        </div>
      </div>

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

      <DeleteCategoryModal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => {
          if (!isLoading) {
            setIsDeleteCategoryModalOpen(false);
            setDeletingCategory(null);
          }
        }}
        onConfirm={handleConfirmDeleteCategory}
        category={deletingCategory}
        isLoading={isLoading}
      />

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;

          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const data = JSON.parse(e.target?.result as string);
              if (data.tasks && Array.isArray(data.tasks) && data.categories && Array.isArray(data.categories)) {
                const existingCategoryNames = categories.map(c => c.name.toLowerCase());
                const newCategories = data.categories.filter((cat: any) => 
                  !existingCategoryNames.includes(cat.name.toLowerCase())
                );
                
                const categoryPromises = newCategories.map((cat: any) => 
                  createCategory({ name: cat.name, color: cat.color }).catch(() => {})
                );
                
                await Promise.allSettled(categoryPromises);

                const taskPromises = data.tasks.map((task: any) => {
                  const importTask = {
                    title: task.title,
                    description: task.description || "",
                    category: task.category,
                    priority: task.priority || "medium",
                    status: "active",
                    dueDate: task.dueDate || null,
                  };
                  return createTask(importTask);
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
        }}
        className="hidden"
      />
    </div>
  );
}