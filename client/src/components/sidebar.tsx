import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Download, Upload, Trash2, CheckSquare, Clock, CheckCircle, X } from "lucide-react";
import type { Task, Category } from "@shared/schema";
import { getTaskStats } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

interface SidebarProps {
  tasks: Task[];
  categories: Category[];
  currentFilter: { status?: string; category?: string };
  onFilterChange: (filter: { status?: string; category?: string }) => void;
  onAddCategory: () => void;
  onDeleteCategory: (categoryId: number) => void;
  onExportData: () => void;
  onImportData: () => void;
  onClearCompleted: () => void;
}

export function Sidebar({
  tasks,
  categories,
  currentFilter,
  onFilterChange,
  onAddCategory,
  onDeleteCategory,
  onExportData,
  onImportData,
  onClearCompleted,
}: SidebarProps) {
  const stats = getTaskStats(tasks);

  const statusFilters = [
    { key: "all", label: "All Tasks", icon: CheckSquare, count: stats.total },
    { key: "active", label: "Active", icon: Clock, count: stats.active },
    { key: "completed", label: "Completed", icon: CheckCircle, count: stats.completed },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-24">
      {/* Quick Stats */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600 font-medium">Total Tasks</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-600 font-medium">Completed</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
            <div className="text-xs text-orange-600 font-medium">Active</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-xs text-red-600 font-medium">Overdue</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{stats.completionRate}%</span>
        </div>
        <Progress value={stats.completionRate} className="h-2" />
      </div>

      {/* Filters */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Filter by Status</h3>
        <div className="space-y-2">
          {statusFilters.map((filter) => {
            const Icon = filter.icon;
            const isActive = currentFilter.status === filter.key || (filter.key === "all" && !currentFilter.status);
            
            return (
              <Button
                key={filter.key}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-between text-sm",
                  isActive && "bg-blue-600 text-white"
                )}
                onClick={() => onFilterChange({ 
                  status: filter.key === "all" ? undefined : filter.key,
                  category: currentFilter.category 
                })}
              >
                <span className="flex items-center">
                  <Icon size={14} className="mr-2" />
                  {filter.label}
                </span>
                <Badge 
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(
                    "text-xs",
                    isActive && "bg-white bg-opacity-20 text-white border-white border-opacity-20"
                  )}
                >
                  {filter.count}
                </Badge>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const isActive = currentFilter.category === category.name;
            
            return (
              <div key={category.id} className="flex items-center group">
                <Button
                  variant="ghost"
                  className={cn(
                    "flex-1 justify-between text-sm",
                    isActive && "bg-gray-100"
                  )}
                  onClick={() => onFilterChange({ 
                    category: isActive ? undefined : category.name,
                    status: currentFilter.status
                  })}
                >
                  <span className="flex items-center">
                    <div 
                      className="w-2 h-2 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteCategory(category.id)}
                  className="p-1 h-auto text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                >
                  <X size={12} />
                </Button>
              </div>
            );
          })}
        </div>
        <Button
          variant="outline"
          className="w-full mt-2 text-sm text-blue-600 border-dashed border-blue-600 hover:bg-blue-50"
          onClick={onAddCategory}
        >
          <Plus size={14} className="mr-2" />
          Add Category
        </Button>
      </div>

      {/* Data Management */}
      <div className="border-t border-gray-200 pt-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-600 hover:bg-gray-50"
            onClick={onExportData}
          >
            <Download size={14} className="mr-2" />
            Export Data
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-gray-600 hover:bg-gray-50"
            onClick={onImportData}
          >
            <Upload size={14} className="mr-2" />
            Import Data
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-sm text-red-600 hover:bg-red-50"
            onClick={onClearCompleted}
          >
            <Trash2 size={14} className="mr-2" />
            Clear Completed
          </Button>
        </div>
      </div>
    </div>
  );
}
