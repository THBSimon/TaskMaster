import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, GripVertical, Calendar, AlertTriangle } from "lucide-react";
import type { Task, Category } from "@shared/schema";
import { formatDueDate, isTaskOverdue, getPriorityColor, getPriorityLabel, getCategoryColor } from "@/lib/task-utils";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
  categories: Category[];
  onToggleComplete: (id: number, completed: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, categories, onToggleComplete, onEdit, onDelete, isDragging }: TaskCardProps) {
  const isCompleted = task.status === "completed";
  const isOverdue = isTaskOverdue(task);
  const dueText = formatDueDate(task.dueDate);
  const categoryColor = getCategoryColor(task.category, categories);

  return (
    <div 
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-all",
        isCompleted && "opacity-75",
        isOverdue && "border-l-4 border-l-red-500",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start space-x-4">
        {/* Drag Handle */}
        <div className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        
        {/* Checkbox */}
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) => onToggleComplete(task.id, !!checked)}
          className="mt-1"
        />
        
        {/* Task Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={cn(
                  "text-sm font-medium truncate",
                  isCompleted ? "text-gray-500 line-through" : "text-gray-900"
                )}>
                  {task.title}
                </h3>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    URGENT
                  </Badge>
                )}
              </div>
              
              {task.description && (
                <p className={cn(
                  "text-sm mt-1",
                  isCompleted ? "text-gray-400 line-through" : "text-gray-500"
                )}>
                  {task.description}
                </p>
              )}
              
              {/* Task Meta */}
              <div className="flex items-center space-x-4 mt-3">
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${categoryColor}20`, 
                    color: categoryColor,
                    borderColor: `${categoryColor}40`
                  }}
                >
                  {task.category}
                </Badge>
                
                {task.dueDate && (
                  <span className={cn(
                    "text-xs flex items-center",
                    isOverdue ? "text-red-600 font-medium" : "text-gray-500"
                  )}>
                    {isOverdue ? (
                      <AlertTriangle size={12} className="mr-1" />
                    ) : (
                      <Calendar size={12} className="mr-1" />
                    )}
                    {dueText}
                  </span>
                )}
                
                <Badge 
                  variant="outline" 
                  className={cn("text-xs", getPriorityColor(task.priority))}
                >
                  {getPriorityLabel(task.priority)}
                </Badge>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(task)}
                className="p-2 h-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(task)}
                className="p-2 h-auto text-gray-400 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
