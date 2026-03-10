'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout, WidgetId, DEFAULT_LAYOUT, mergeWithDefaults } from '@/lib/dashboard-config';

export function useDashboardLayout() {
  const [layout, setLayout]       = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [editMode, setEditMode]   = useState(false);
  const [draft, setDraft]         = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [saving, setSaving]       = useState(false);
  const [loaded, setLoaded]       = useState(false);

  // ── Load from server on mount ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/dashboard/layout')
      .then(r => r.json())
      .then(data => {
        const resolved = data ? mergeWithDefaults(data) : DEFAULT_LAYOUT;
        setLayout(resolved);
        setDraft(resolved);
      })
      .catch(() => { /* use defaults silently */ })
      .finally(() => setLoaded(true));
  }, []);

  // ── Edit mode helpers ────────────────────────────────────────────────────
  const enterEditMode = useCallback(() => {
    setDraft(layout);
    setEditMode(true);
  }, [layout]);

  const cancelEdit = useCallback(() => {
    setDraft(layout); // discard
    setEditMode(false);
  }, [layout]);

  const saveLayout = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const saved = await res.json();
      setLayout(saved);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }, [draft]);

  const resetLayout = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/dashboard/layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEFAULT_LAYOUT),
      });
      const saved = await res.json();
      setLayout(saved);
      setDraft(saved);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Draft mutations (only applied on Save) ───────────────────────────────
  const reorderDraft = useCallback((orderedIds: WidgetId[]) => {
    setDraft(prev => ({
      widgets: orderedIds.map(id => prev.widgets.find(w => w.id === id)!),
    }));
  }, []);

  const toggleVisibility = useCallback((id: WidgetId) => {
    setDraft(prev => ({
      widgets: prev.widgets.map(w =>
        w.id === id ? { ...w, visible: !w.visible } : w
      ),
    }));
  }, []);

  // ── Visible widgets for rendering ────────────────────────────────────────
  const visibleWidgets = layout.widgets.filter(w => w.visible);

  return {
    layout,
    draft,
    editMode,
    saving,
    loaded,
    visibleWidgets,
    enterEditMode,
    cancelEdit,
    saveLayout,
    resetLayout,
    reorderDraft,
    toggleVisibility,
  };
}
