import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Edit } from "lucide-react";

type Props = {
  note: {
    type: string;
    title: string;
    content?: string;
    [key: string]: any;
  };
  onSave: (data: { title: string; content: string }) => void;
};

export function EditNoteDialog({ note, onSave }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: note?.title || "",
    content: note?.content || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center w-full justify-between "
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <span className="text-sm font-medium text-gray-700">Edit</span>
          <Edit className="w-3 h-3 text-gray-500" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900">
              Edit Note
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label
                htmlFor="title"
                className="text-right font-medium text-gray-600"
              >
                Title
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter note title"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label
                htmlFor="content"
                className="text-right font-medium text-gray-600 mt-2"
              >
                Content
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={handleChange}
                className="col-span-3"
                placeholder="Enter note content"
                rows={5}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-gray-600 hover:bg-gray-100"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
