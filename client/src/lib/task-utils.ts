import type { Task } from "@shared/schema";
import { format, isAfter, isPast, parseISO } from "date-fns";

export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return "";
  
  try {
    const date = parseISO(dueDate);
    const today = new Date();
    
    if (isPast(date) && !isSameDay(date, today)) {
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return `Overdue by ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
    }
    
    return `Due ${format(date, 'MMM d')}`;
  } catch {
    return "";
  }
}

export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === "completed") return false;
  
  try {
    const dueDate = parseISO(task.dueDate);
    const today = new Date();
    return isPast(dueDate) && !isSameDay(dueDate, today);
  } catch {
    return false;
  }
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-800";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export function getPriorityLabel(priority: string): string {
  switch (priority) {
    case "high":
      return "High Priority";
    case "medium":
      return "Medium Priority";
    case "low":
      return "Low Priority";
    default:
      return priority;
  }
}

export function getCategoryColor(categoryName: string, categories: any[]): string {
  const category = categories.find(c => c.name === categoryName);
  return category?.color || "#1976D2";
}

export function sortTasks(tasks: Task[], sortBy: string): Task[] {
  const sortedTasks = [...tasks];
  
  switch (sortBy) {
    case "created":
      return sortedTasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case "due":
      return sortedTasks.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    case "priority":
      const priorityOrder = { "high": 3, "medium": 2, "low": 1 };
      return sortedTasks.sort((a, b) => (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - (priorityOrder[a.priority as keyof typeof priorityOrder] || 0));
    case "alphabetical":
      return sortedTasks.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return sortedTasks;
  }
}

export function filterTasks(tasks: Task[], filters: {
  status?: string;
  category?: string;
  search?: string;
}): Task[] {
  return tasks.filter(task => {
    // Status filter
    if (filters.status && filters.status !== "all") {
      if (filters.status !== task.status) return false;
    }
    
    // Category filter
    if (filters.category && filters.category !== task.category) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
      if (!titleMatch && !descriptionMatch) return false;
    }
    
    return true;
  });
}

export function getTaskStats(tasks: Task[]) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const active = tasks.filter(t => t.status === "active").length;
  const overdue = tasks.filter(t => isTaskOverdue(t)).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    active,
    overdue,
    completionRate,
  };
}

export function exportTasksAsJSON(tasks: Task[], categories: any[]): string {
  const data = {
    tasks,
    categories,
    exportDate: new Date().toISOString(),
    version: "1.0",
  };
  return JSON.stringify(data, null, 2);
}

export function downloadFile(content: string, filename: string, contentType: string = "application/json") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
