'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { WidgetId, WIDGET_META } from '@/lib/dashboard-config';
import { cn } from '@/lib/utils';

interface WidgetShellProps {
  id: WidgetId;
  visible: boolean;
  editMode: boolean;
  onToggleVisibility: (id: WidgetId) => void;
  children: React.ReactNode;
}

export function WidgetShell({ id, visible, editMode, onToggleVisibility, children }: WidgetShellProps) {
  const meta = WIDGET_META[id];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('relative', isDragging && 'z-50')}>
      {/* ── Edit-mode overlay ── */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            key="edit-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute inset-0 z-20 rounded-xl pointer-events-none',
              'ring-2 ring-dashed',
              visible
                ? 'ring-primary/40 bg-primary/[0.02]'
                : 'ring-border/50 bg-muted/20'
            )}
          />
        )}
      </AnimatePresence>

      {/* ── Edit-mode control bar ── */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            key="control-bar"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 left-2 right-2 z-30 flex items-center gap-1.5"
          >
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className={cn(
                'flex items-center gap-1 pl-1.5 pr-2 py-1 rounded-md',
                'bg-background/90 backdrop-blur-sm border border-border/60 shadow-sm',
                'text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing',
                'touch-none select-none transition-colors'
              )}
            >
              <GripVertical className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium max-w-[140px] truncate hidden sm:inline">
                {meta.label}
              </span>
            </button>

            {/* Visibility toggle */}
            <button
              onClick={() => onToggleVisibility(id)}
              className={cn(
                'ml-auto flex items-center gap-1 px-2 py-1 rounded-md',
                'bg-background/90 backdrop-blur-sm border border-border/60 shadow-sm',
                'text-xs font-medium transition-colors',
                visible
                  ? 'text-foreground hover:text-red-500 hover:border-red-400'
                  : 'text-muted-foreground hover:text-emerald-600 hover:border-emerald-400'
              )}
            >
              {visible
                ? <><EyeOff className="w-3 h-3" /><span className="hidden sm:inline">Hide</span></>
                : <><Eye    className="w-3 h-3" /><span className="hidden sm:inline">Show</span></>
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Widget content ── */}
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: isDragging ? 'hidden' : undefined }}
            className={cn(editMode && 'pt-8')}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hidden placeholder (edit mode only) ── */}
      <AnimatePresence initial={false}>
        {editMode && !visible && (
          <motion.div
            key="hidden-placeholder"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="pt-8"
          >
            <div className="flex items-center justify-center py-5 rounded-xl border-2 border-dashed border-border/40 bg-muted/10">
              <div className="text-center">
                <EyeOff className="w-4 h-4 text-muted-foreground/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground/60 font-medium">{meta.label}</p>
                <p className="text-[10px] text-muted-foreground/40 mt-0.5">{meta.description}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
