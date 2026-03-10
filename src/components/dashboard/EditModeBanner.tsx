'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Save, RotateCcw, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditModeBannerProps {
  editMode: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
}

export function EditModeBanner({ editMode, saving, onSave, onReset, onCancel }: EditModeBannerProps) {
  return (
    <AnimatePresence>
      {editMode && (
        <motion.div
          key="edit-banner"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="hidden md:flex items-center gap-3 px-4 py-2.5 mb-4 rounded-xl
                     bg-primary/10 border border-primary/20 backdrop-blur-sm"
        >
          <LayoutDashboard className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-sm text-foreground font-medium flex-1 min-w-0">
            <span className="font-bold text-primary">Editing layout</span>
            <span className="text-muted-foreground ml-2 hidden lg:inline">
              — drag ⠿ to reorder · click Hide/Show to toggle visibility
            </span>
          </p>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              onClick={onReset}
              disabled={saving}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="w-3 h-3" />
              Discard
            </Button>

            <Button
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={onSave}
              disabled={saving}
            >
              {saving
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Save className="w-3 h-3" />
              }
              {saving ? 'Saving…' : 'Save Layout'}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
