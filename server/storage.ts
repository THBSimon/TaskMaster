import { tasks, categories, type Task, type InsertTask, type Category, type InsertCategory } from "@shared/schema";

export interface IStorage {
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private tasks: Map<number, Task>;
  private categories: Map<number, Category>;
  private currentTaskId: number;
  private currentCategoryId: number;

  constructor() {
    this.tasks = new Map();
    this.categories = new Map();
    this.currentTaskId = 1;
    this.currentCategoryId = 1;
    
    // Initialize default categories
    this.initializeDefaultCategories();
  }

  private initializeDefaultCategories() {
    const defaultCategories = [
      { name: "Work", color: "#1976D2" },
      { name: "Personal", color: "#4CAF50" },
      { name: "Shopping", color: "#9C27B0" },
      { name: "Health", color: "#FF9800" },
    ];

    defaultCategories.forEach(cat => {
      const category: Category = {
        id: this.currentCategoryId++,
        name: cat.name,
        color: cat.color,
        count: 0,
      };
      this.categories.set(category.id, category);
    });
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => a.order - b.order);
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date().toISOString();
    const task: Task = {
      ...insertTask,
      id,
      createdAt: now,
      completedAt: null,
      order: this.tasks.size,
    };
    this.tasks.set(id, task);
    await this.updateCategoryCount(task.category);
    return task;
  }

  async updateTask(id: number, updateData: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const oldCategory = existingTask.category;
    const updatedTask: Task = {
      ...existingTask,
      ...updateData,
      completedAt: updateData.status === "completed" ? new Date().toISOString() : 
                   updateData.status === "active" ? null : existingTask.completedAt,
    };

    this.tasks.set(id, updatedTask);

    // Update category counts if category changed
    if (updateData.category && updateData.category !== oldCategory) {
      await this.updateCategoryCount(oldCategory);
      await this.updateCategoryCount(updateData.category);
    }

    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    this.tasks.delete(id);
    await this.updateCategoryCount(task.category);
    return true;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
      count: 0,
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, updateData: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory: Category = {
      ...existingCategory,
      ...updateData,
    };

    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  private async updateCategoryCount(categoryName: string) {
    const category = Array.from(this.categories.values()).find(c => c.name === categoryName);
    if (!category) return;

    const count = Array.from(this.tasks.values()).filter(t => t.category === categoryName).length;
    category.count = count;
    this.categories.set(category.id, category);
  }
}

export const storage = new MemStorage();
