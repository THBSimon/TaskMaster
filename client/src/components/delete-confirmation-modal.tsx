import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import type { Task } from "@shared/schema";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  task: Task | null;
}

export function DeleteConfirmationModal({ isOpen, onClose, onConfirm, task }: DeleteConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="text-red-600" size={20} />
            </div>
            <div>
              <DialogTitle className="text-lg font-medium text-gray-900">Delete Task</DialogTitle>
              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
          </div>
        </DialogHeader>
        
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete "{task?.title}"?
        </p>
        
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
