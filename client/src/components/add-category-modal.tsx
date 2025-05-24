import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name too long"),
  color: z.string().min(1, "Please select a color"),
});

type FormData = z.infer<typeof formSchema>;

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; color: string }) => void;
}

const predefinedColors = [
  "#1976D2", // Blue
  "#4CAF50", // Green
  "#FF9800", // Orange
  "#9C27B0", // Purple
  "#F44336", // Red
  "#00BCD4", // Cyan
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#E91E63", // Pink
  "#8BC34A", // Light Green
  "#FFC107", // Amber
  "#673AB7", // Deep Purple
];

export function AddCategoryModal({ isOpen, onClose, onSubmit }: AddCategoryModalProps) {
  const [selectedColor, setSelectedColor] = useState(predefinedColors[0]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      color: predefinedColors[0],
    },
  });

  const handleSubmit = (data: FormData) => {
    onSubmit({ name: data.name.trim(), color: selectedColor });
    form.reset();
    setSelectedColor(predefinedColors[0]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Create a new category to organize your tasks.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Category Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter category name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Color Selection */}
            <div>
              <FormLabel>Color</FormLabel>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {predefinedColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor === color ? "border-gray-800 scale-110" : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setSelectedColor(color);
                      form.setValue("color", color);
                    }}
                  />
                ))}
              </div>
              <div className="mt-2">
                <Badge 
                  variant="secondary"
                  style={{ 
                    backgroundColor: `${selectedColor}20`, 
                    color: selectedColor,
                    borderColor: `${selectedColor}40`
                  }}
                >
                  Preview
                </Badge>
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Create Category
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}