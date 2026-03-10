'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Eye, EyeOff, X, Save, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WidgetId, WidgetConfig, WIDGET_META } from '@/lib/dashboard-config';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

interface MobileEditSheetProps {
  open: boolean;
  draft: { widgets: WidgetConfig[] };
  saving: boolean;
  onReorder: (ids: WidgetId[]) => void;
  onToggle: (id: WidgetId) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
}

function SortableRow({ widget, onToggle }: { widget: WidgetConfig; onToggle: (id: WidgetId) => void }) {
  const meta = WIDGET_META[widget.id];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: widget.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-card transition-shadow',
        isDragging ? 'shadow-lg border-primary/30 z-50' : 'border-border/50',
        !widget.visible && 'opacity-50'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing touch-none p-1"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{meta.label}</p>
        <p className="text-[10px] text-muted-foreground truncate">{meta.description}</p>
      </div>

      <button
        onClick={() => onToggle(widget.id)}
        className={cn(
          'p-1.5 rounded-md transition-colors',
          widget.visible
            ? 'text-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950'
            : 'text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'
        )}
      >
        {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function MobileEditSheet({
  open, draft, saving, onReorder, onToggle, onSave, onReset, onClose,
}: MobileEditSheetProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids  = draft.widgets.map(w => w.id);
    const from = ids.indexOf(active.id as WidgetId);
    const to   = ids.indexOf(over.id   as WidgetId);
    onReorder(arrayMove(ids, from, to));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background rounded-t-2xl
                       shadow-2xl border-t border-border flex flex-col max-h-[85vh]"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 flex-shrink-0">
              <p className="font-semibold text-sm flex-1">Customize Dashboard</p>
              <button onClick={onClose} className="text-muted-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground px-4 py-2 flex-shrink-0">
              Drag to reorder · tap 👁 to show/hide
            </p>

            {/* Sortable list */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={draft.widgets.map(w => w.id)} strategy={verticalListSortingStrategy}>
                  {draft.widgets.map(w => (
                    <SortableRow key={w.id} widget={w} onToggle={onToggle} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 p-4 border-t border-border/50 flex-shrink-0 pb-safe">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={onReset} disabled={saving}>
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={onClose} disabled={saving}>
                <X className="w-3 h-3" /> Discard
              </Button>
              <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={onSave} disabled={saving}>
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
