import { cn } from "@/lib/utils";
import { useDndContext } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";

interface DragAwareTomModalProps {
  children: React.ReactNode;
  isTomVisible?: boolean;
}

const DragAwareTomModal = ({
  children,
  isTomVisible = true,
}: DragAwareTomModalProps) => {
  const { active } = useDndContext();

  // Chỉ hiện modal khi đang drag VÀ TopOfMind gốc không hiển thị trên màn hình
  const shouldShowFloatingModal = !!active && !isTomVisible;

  return (
    <div>
      {shouldShowFloatingModal && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 w-[90vw] max-w-4xl"
        >
          {/* Lớp nền (Overlay) */}
          <div className="absolute inset-0 -z-10 bg-blue-200/30 blur-xl rounded-2xl" />

          {/* Nội dung bên trong */}
          <div className="relative z-10">{children}</div>
        </motion.div>
      )}
    </div>
  );
};

export default DragAwareTomModal;
