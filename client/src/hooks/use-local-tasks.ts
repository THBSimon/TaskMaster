import { useState, useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";
import type { Task, InsertTask, Category, InsertCategory } from "@shared/schema";

// Generate unique IDs
const generateId = () => Date.now() + Math.random();

// Default categories
const defaultCategories: Category[] = [
  { id: 1, name: "Work", color: "#1976D2", count: 0 },
  { id: 2, name: "Personal", color: "#4CAF50", count: 0 },
  { id: 3, name: "Shopping", color: "#9C27B0", count: 0 },
  { id: 4, name: "Health", color: "#FF9800", count: 0 },
];

export function useLocalTasks() {
  const [tasks, setTasks] = useLocalStorage<Task[]>("taskflow-tasks", []);
  const [categories, setCategories] = useLocalStorage<Category[]>("taskflow-categories", defaultCategories);
  const [isLoading, setIsLoading] = useState(false);

  // Update category counts whenever tasks change
  useEffect(() => {
    const updatedCategories = categories.map(category => ({
      ...category,
      count: tasks.filter(task => task.category === category.name).length
    }));
    
    // Only update if counts actually changed
    const countsChanged = updatedCategories.some((cat, index) => 
      cat.count !== categories[index]?.count
    );
    
    if (countsChanged) {
      setCategories(updatedCategories);
    }
  }, [tasks, categories, setCategories]);

  const createTask = async (taskData: InsertTask): Promise<Task> => {
    setIsLoading(true);
    
    // Simulate API delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      status: taskData.status || "active",
      dueDate: taskData.dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      order: tasks.length,
    };
    
    setTasks(prev => [...prev, newTask]);
    setIsLoading(false);
    return newTask;
  };

  const updateTask = async (id: number, updates: Partial<InsertTask>): Promise<Task | undefined> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const task = tasks.find(t => t.id === id);
    if (!task) {
      setIsLoading(false);
      return undefined;
    }

    const updatedTask: Task = {
      ...task,
      ...updates,
      completedAt: updates.status === "completed" ? new Date().toISOString() : 
                   updates.status === "active" ? null : task.completedAt,
    };

    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t));
    setIsLoading(false);
    return updatedTask;
  };

  const deleteTask = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    
    setTasks(prev => prev.filter(t => t.id !== id));
    setIsLoading(false);
    return true;
  };

  const createCategory = async (categoryData: InsertCategory): Promise<Category> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if category already exists
    const exists = categories.some(cat => 
      cat.name.toLowerCase() === categoryData.name.toLowerCase()
    );
    
    if (exists) {
      setIsLoading(false);
      throw new Error("Category already exists");
    }

    const newCategory: Category = {
      ...categoryData,
      id: generateId(),
      color: categoryData.color || "#1976D2",
      count: 0,
    };
    
    setCategories(prev => [...prev, newCategory]);
    setIsLoading(false);
    return newCategory;
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    
    setCategories(prev => prev.filter(c => c.id !== id));
    setIsLoading(false);
    return true;
  };

  return {
    tasks,
    categories,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    createCategory,
    deleteCategory,
  };
}