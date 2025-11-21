'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  Bars3Icon,
  Cog6ToothIcon,
  EyeIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

import { PageEditBanner } from './page-edit-banner';
import type { PageBlock, PageColumn, PageSection } from '@/lib/cms/types';

interface PageEditorCanvasProps {
  path: string;
  initialTitle: string;
  sections: PageSection[];
  exitHref: string;
  settingsHref: string;
  onSaved?: (update: { title: string; body: string; sections: PageSection[] }) => void;
  source: ReactNode;
}

interface EditableBlock extends PageBlock {
  html?: string;
  props?: Record<string, unknown>;
}

interface EditableColumn extends PageColumn {
  blocks: EditableBlock[];
}

interface EditableSection {
  id: string;
  title?: string;
  columns: EditableColumn[];
}

interface ComponentMeta {
  id: string;
  title: string;
  description?: string;
  status?: string;
  tags?: string[];
}

interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  message?: string;
}

interface DragState {
  type: 'section' | 'block' | 'component' | null;
  sectionId?: string | null;
  columnId?: string | null;
  blockId?: string | null;
  componentId?: string | null;
}

interface SelectionToolbarState {
  visible: boolean;
  x: number;
  y: number;
  sectionId: string | null;
  columnId: string | null;
  blockId: string | null;
}

interface RevisionMeta {
  id: string;
  version: number;
  createdAt: string;
  authorId?: string;
  status?: string;
}

const HEADING_OPTIONS = [
  { value: 'heading-1', label: 'Heading 1', tag: 'h1' },
  { value: 'heading-2', label: 'Heading 2', tag: 'h2' },
  { value: 'heading-3', label: 'Heading 3', tag: 'h3' },
  { value: 'heading-4', label: 'Heading 4', tag: 'h4' },
  { value: 'heading-5', label: 'Heading 5', tag: 'h5' },
  { value: 'heading-6', label: 'Heading 6', tag: 'h6' },
  { value: 'paragraph', label: 'Paragraph', tag: 'p' },
  { value: 'small-paragraph', label: 'Small Paragraph', tag: 'p' }
] as const;

type HeadingValue = (typeof HEADING_OPTIONS)[number]['value'];

export function PageEditorCanvas({ path, initialTitle, sections, exitHref, settingsHref, onSaved, source }: PageEditorCanvasProps) {
  const [editableSections, setEditableSections] = useState<EditableSection[]>(() => normalizeForEditing(sections));
  const [components, setComponents] = useState<ComponentMeta[]>([]);
  const [versions, setVersions] = useState<RevisionMeta[]>([]);
  const [pageTitle, setPageTitle] = useState(initialTitle);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState>({
    visible: false,
    x: 0,
    y: 0,
    sectionId: null,
    columnId: null,
    blockId: null
  });
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [configSectionId, setConfigSectionId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({ type: null });
  const [isPreviewMode, setPreviewMode] = useState(false);
  const [isRestoring, setRestoring] = useState(false);
  const [isDirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const [isPending, startTransition] = useTransition();
  const [showSavedToast, setShowSavedToast] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitleDraft, setSectionTitleDraft] = useState('');
  const [sectionTitleFallback, setSectionTitleFallback] = useState('');

  const historyRef = useRef<{ past: EditableSection[][]; future: EditableSection[][] }>({ past: [], future: [] });
  const initializedRef = useRef(false);
  const originalRef = useRef<HTMLDivElement>(null);
  const editorRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastSelectionRef = useRef<Range | null>(null);
  const sectionTitleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadComponents() {
      try {
        const response = await fetch('/api/admin/components', { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { components: ComponentMeta[] };
        setComponents(data.components);
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') {
          return;
        }
      }
    }
    loadComponents();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[PageEditorCanvas] sections prop', sections);
    }
    const normalized = normalizeForEditing(sections);
    setEditableSections(normalized);
    historyRef.current = { past: [], future: [] };
    setDirty(false);
    setSaveState({ status: 'idle' });
    if (!initializedRef.current) {
      initializedRef.current = true;
    }
    setEditingSectionId(null);
    setSectionTitleDraft('');
    setSectionTitleFallback('');
  }, [sections]);

  useEffect(() => {
    editableSections.forEach((section) => {
      section.columns.forEach((column) => {
        column.blocks.forEach((block) => {
          const element = editorRefs.current.get(block.id);
          if (element && element.innerHTML !== (block.html ?? '')) {
            element.innerHTML = block.html ?? '';
          }
        });
      });
    });
  }, [editableSections]);

  useEffect(() => {
    setPageTitle(initialTitle);
  }, [initialTitle]);

  useEffect(() => {
    fetchVersions();
  }, [path]);

  useEffect(() => {
    if (isPreviewMode) {
      setSelectionToolbar((prev) => ({ ...prev, visible: false }));
    }
  }, [isPreviewMode]);

  const updateSelectionToolbar = useCallback(() => {
    if (isPreviewMode) {
      setSelectionToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect || (rect.width === 0 && rect.height === 0)) {
      setSelectionToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    const { sectionId, columnId, blockId } = findBlockContext(range.startContainer as Node);
    if (!sectionId || !columnId || !blockId) {
      setSelectionToolbar((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      return;
    }
    lastSelectionRef.current = range.cloneRange();
    setSelectionToolbar({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 12,
      sectionId,
      columnId,
      blockId
    });
  }, [isPreviewMode]);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isMouseDown) {
        return;
      }
      updateSelectionToolbar();
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, [updateSelectionToolbar, isMouseDown]);

  useEffect(() => {
    const onMouseDown = () => setIsMouseDown(true);
    const onMouseUp = () => {
      setIsMouseDown(false);
      setTimeout(() => updateSelectionToolbar(), 0);
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [updateSelectionToolbar]);

  useEffect(() => {
    if (editingSectionId) {
      const handle = setTimeout(() => {
        sectionTitleInputRef.current?.focus();
        sectionTitleInputRef.current?.select();
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [editingSectionId]);

  const formattingActions = useMemo(
    () => [
      { label: 'Bold', command: 'bold', icon: 'B' },
      { label: 'Italic', command: 'italic', icon: 'I' },
      { label: 'Underline', command: 'underline', icon: 'U' },
      { label: 'Bullets', command: 'insertUnorderedList', icon: '•' },
      { label: 'Numbered', command: 'insertOrderedList', icon: '1.' },
      { label: 'Link', command: 'createLink', prompt: true, icon: '🔗' },
      { label: 'Clear', command: 'removeFormat', icon: '⨉' }
    ],
    []
  );

  const commitSections = (
    next: EditableSection[] | ((previous: EditableSection[]) => EditableSection[]),
    { pushHistory = true }: { pushHistory?: boolean } = {}
  ) => {
    setEditableSections((prev) => {
      const computed = typeof next === 'function' ? (next as (prev: EditableSection[]) => EditableSection[])(prev) : next;
      if (pushHistory) {
        historyRef.current.past.push(cloneSections(prev));
        historyRef.current.future = [];
      }
      setDirty(true);
      return cloneSections(computed);
    });
  };

  const updateBlockHtml = (sectionId: string, columnId: string, blockId: string, html: string) => {
    setEditableSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column;
            return {
              ...column,
              blocks: column.blocks.map((block) => (block.id === blockId ? { ...block, html } : block))
            };
          })
        };
      })
    );
    setDirty(true);
  };

  const applyHeadingStyle = (value: HeadingValue) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    if (selection.rangeCount === 0) {
      if (lastSelectionRef.current) {
        selection.removeAllRanges();
        selection.addRange(lastSelectionRef.current);
      }
    }
    if (selection.rangeCount === 0) {
      return;
    }
    const option = HEADING_OPTIONS.find((item) => item.value === value);
    if (!option) return;

    document.execCommand('formatBlock', false, option.tag.toUpperCase());

    const context = findBlockContext(selection.focusNode as Node);
    if (!context.sectionId || !context.columnId || !context.blockId) {
      return;
    }
    const editor = editorRefs.current.get(context.blockId);
    if (editor) {
      if (option.value === 'small-paragraph') {
        applyClassToSelection('text-sm');
      } else {
        removeClassFromSelection('text-sm');
      }
      updateBlockHtml(context.sectionId, context.columnId, context.blockId, editor.innerHTML);
    }
  };

  const handleToolbarAction = (command: string, value?: string, promptUser = false) => {
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    if (selection.rangeCount === 0 && lastSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(lastSelectionRef.current);
    }
    if (selection.rangeCount === 0) {
      return;
    }
    let commandValue = value;
    if (promptUser) {
      const input = window.prompt('Enter URL');
      if (!input) return;
      commandValue = input;
    }
    document.execCommand(command, false, commandValue ?? undefined);
    const context = selectionToolbar;
    if (context.sectionId && context.columnId && context.blockId) {
      const editor = editorRefs.current.get(context.blockId);
      if (editor) {
        updateBlockHtml(context.sectionId, context.columnId, context.blockId, editor.innerHTML);
      }
    }
  };

  const handleUndo = () => {
    const past = historyRef.current.past;
    if (past.length === 0) {
      document.execCommand('undo');
      return;
    }
    const previous = past.pop()!;
    historyRef.current.future.unshift(cloneSections(editableSections));
    setEditableSections(previous);
    setDirty(true);
  };

  const handleRedo = () => {
    const future = historyRef.current.future;
    if (future.length === 0) {
      document.execCommand('redo');
      return;
    }
    const next = future.shift()!;
    historyRef.current.past.push(cloneSections(editableSections));
    setEditableSections(next);
    setDirty(true);
  };

  const handleAddSection = () => {
    commitSections((prev) => [...prev, createEmptySection()]);
  };

  const handleRemoveSection = (sectionId: string) => {
    commitSections((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((section) => section.id !== sectionId);
    });
  };

  const handleSectionDrop = (index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const { type, sectionId } = dragState;
    setDragState({ type: null });
    if (type !== 'section' || !sectionId) return;
    const currentIndex = editableSections.findIndex((section) => section.id === sectionId);
    if (currentIndex === -1 || currentIndex === index || currentIndex + 1 === index) return;
    const reordered = arrayMove(editableSections, currentIndex, index > currentIndex ? index - 1 : index);
    commitSections(reordered);
  };

  const handleColumnCountChange = (sectionId: string, count: number) => {
    const normalizedCount = Math.min(12, Math.max(1, Math.floor(count)));
    commitSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: redistributeColumns(section.columns, normalizedCount)
        };
      })
    );
  };

  const handleAddBlock = (sectionId: string, columnId: string, index?: number) => {
    commitSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column;
            const blocks = [...column.blocks];
            const insertionIndex =
              typeof index === 'number' && !Number.isNaN(index)
                ? Math.min(Math.max(index, 0), blocks.length)
                : blocks.length;
            blocks.splice(insertionIndex, 0, createRichTextBlock(''));
            return {
              ...column,
              blocks
            };
          })
        };
      })
    );
  };

  const handleRemoveBlock = (sectionId: string, columnId: string, blockId: string) => {
    commitSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column;
            const remaining = column.blocks.filter((block) => block.id !== blockId);
            return {
              ...column,
              blocks: remaining.length > 0 ? remaining : [createRichTextBlock('')]
            };
          })
        };
      })
    );
  };

  const handleBlockDrop = (sectionId: string, columnId: string, index: number) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const state = dragState;
    setDragState({ type: null });

    if (state.type === 'component' && state.componentId) {
      commitSections((prev) =>
        prev.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            columns: section.columns.map((column) => {
              if (column.id !== columnId) return column;
              const nextBlocks = [...column.blocks];
              nextBlocks.splice(index, 0, createComponentBlock(state.componentId!));
              return { ...column, blocks: nextBlocks };
            })
          };
        })
      );
      return;
    }

    if (state.type === 'block' && state.blockId && state.sectionId && state.columnId) {
      if (state.sectionId === sectionId && state.columnId === columnId) {
        const column = editableSections
          .find((section) => section.id === sectionId)?.columns
          .find((col) => col.id === columnId);
        if (!column) return;
        const currentIndex = column.blocks.findIndex((block) => block.id === state.blockId);
        if (currentIndex === -1 || currentIndex === index || currentIndex + 1 === index) return;
        commitSections((prev) =>
          prev.map((section) => {
            if (section.id !== sectionId) return section;
            return {
              ...section,
              columns: section.columns.map((column) => {
                if (column.id !== columnId) return column;
                const moved = arrayMove(column.blocks, currentIndex, index > currentIndex ? index - 1 : index);
                return { ...column, blocks: moved };
              })
            };
          })
        );
        return;
      }

      let movingBlock: EditableBlock | null = null;
      const without = editableSections.map((section) => {
        if (section.id !== state.sectionId) return section;
        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== state.columnId) return column;
            const indexToRemove = column.blocks.findIndex((block) => block.id === state.blockId);
            if (indexToRemove === -1) return column;
            const copy = [...column.blocks];
            [movingBlock] = copy.splice(indexToRemove, 1);
            return {
              ...column,
              blocks: copy.length > 0 ? copy : [createRichTextBlock('')]
            };
          })
        };
      });

      if (!movingBlock) {
        return;
      }

      commitSections((prev) =>
        without.map((section) => {
          if (section.id !== sectionId) return section;
          return {
            ...section,
            columns: section.columns.map((column) => {
              if (column.id !== columnId) return column;
              const copy = [...column.blocks];
              copy.splice(index, 0, movingBlock!);
              return { ...column, blocks: copy };
            })
          };
        })
      );
    }
  };

  const handlePaletteClick = (component: ComponentMeta) => {
    commitSections((prev) =>
      prev.length === 0
        ? [createComponentSection(component.id)]
        : prev.map((section, index) =>
            index === prev.length - 1
              ? {
                  ...section,
                  columns: section.columns.map((column, colIndex) =>
                    colIndex === section.columns.length - 1
                      ? { ...column, blocks: [...column.blocks, createComponentBlock(component.id)] }
                      : column
                  )
                }
              : section
          )
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      setSaveState({ status: 'saving' });
      const payload = editableSections.map(serializeSection);
      const response = await fetch(`/api/admin/pages/by-path?path=${encodeURIComponent(path)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: pageTitle, sections: payload })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setSaveState({ status: 'error', message: data.error ?? 'Failed to save changes.' });
        return;
      }

      const data = (await response.json()) as { page: { title?: string; body?: string; sections: PageSection[] } };
      const normalized = normalizeForEditing(data.page.sections);
      setEditableSections(normalized);
      setPageTitle(data.page.title ?? pageTitle);
      historyRef.current = { past: [], future: [] };
      setDirty(false);
      setSaveState({ status: 'saved', message: 'Changes saved' });
      setPreviewMode(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
      if (typeof document !== 'undefined') {
        document.title = data.page.title ?? pageTitle;
      }
      onSaved?.({
        title: data.page.title ?? pageTitle,
        body: data.page.body ?? flattenSectionsToHtml(normalized),
        sections: data.page.sections
      });
      await fetch('/api/admin/pages/navigation', {
        method: 'POST'
      });
      await fetchVersions();
    });
  };

  const handlePreviewToggle = () => {
    setPreviewMode((prev) => !prev);
  };

  const handleTitleChange = (value: string) => {
    setPageTitle(value);
    setDirty(true);
  };

  const getSectionDisplayTitle = (section: EditableSection, index: number) =>
    section.title?.trim() || `Section ${index + 1}`;

  const startEditingSectionTitle = (section: EditableSection, index: number) => {
    const fallback = getSectionDisplayTitle(section, index);
    setEditingSectionId(section.id);
    setSectionTitleDraft(section.title ?? fallback);
    setSectionTitleFallback(fallback);
  };

  const commitSectionTitle = (sectionId: string, value: string, fallback: string) => {
    const nextTitle = value.trim() || fallback;
    commitSections((prev) =>
      prev.map((section) => (section.id === sectionId ? { ...section, title: nextTitle } : section))
    );
    setEditingSectionId(null);
    setSectionTitleDraft('');
    setSectionTitleFallback('');
  };

  const cancelSectionTitleEdit = () => {
    setEditingSectionId(null);
    setSectionTitleDraft('');
    setSectionTitleFallback('');
  };

  const handleRestoreVersion = () => {
    if (!selectedVersionId) return;
    setRestoring(true);
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/pages/versions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ path, revisionId: selectedVersionId })
        });
        if (!response.ok) {
          return;
        }
        const data = (await response.json()) as { page: { title?: string; body?: string; sections: PageSection[] } };
        const normalized = normalizeForEditing(data.page.sections);
        setEditableSections(normalized);
        setPageTitle(data.page.title ?? pageTitle);
        historyRef.current = { past: [], future: [] };
        setDirty(false);
        setPreviewMode(false);
        onSaved?.({
          title: data.page.title ?? pageTitle,
          body: data.page.body ?? flattenSectionsToHtml(normalized),
          sections: data.page.sections
        });
        await fetch('/api/admin/pages/navigation', {
          method: 'POST'
        });
        await fetchVersions();
        setShowSavedToast(true);
        setTimeout(() => setShowSavedToast(false), 3000);
        if (typeof document !== 'undefined') {
          document.title = data.page.title ?? pageTitle;
        }
      } finally {
        setRestoring(false);
      }
    });
  };

  async function fetchVersions() {
    try {
      const response = await fetch(`/api/admin/pages/versions?path=${encodeURIComponent(path)}`);
      if (!response.ok) return;
      const data = (await response.json()) as { revisions: RevisionMeta[] };
      setVersions(data.revisions);
      setSelectedVersionId(data.revisions[0]?.id ?? null);
    } catch (error) {
      /* ignore */
    }
  }

  const toast = showSavedToast ? (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg">
      Changes saved
    </div>
  ) : null;

  const hasPreviewContent = editableSections.some((section) =>
    section.columns.some((column) =>
      column.blocks.some((block) => (block.kind === 'component' ? true : (block.html ?? '').trim().length > 0))
    )
  );

  const previewPane = hasPreviewContent ? (
    <div className="space-y-10">
      {editableSections.map((section) => (
        <div key={section.id} className="grid grid-cols-12 gap-6">
          {section.columns.map((column) => (
            <div key={column.id} className="space-y-6" style={{ gridColumn: `span ${column.span} / span ${column.span}` }}>
              {column.blocks.map((block) =>
                block.kind === 'component' ? (
                  <div key={block.id} className="rounded-xl border border-ds-border bg-white p-6 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">Component: {block.componentId ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-500">Rendering coming soon.</p>
                  </div>
                ) : (
                  <div
                    key={block.id}
                    className="prose prose-slate max-w-none"
                    dangerouslySetInnerHTML={{ __html: block.html ?? '' }}
                  />
                )
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  ) : (
    <div className="prose prose-slate max-w-none">{source}</div>
  );

  return (
    <div className="space-y-6">
      <PageEditBanner path={path} exitHref={exitHref} settingsHref={settingsHref} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_1fr_minmax(0,240px)]">
        <aside className="self-start space-y-4 rounded-2xl border border-ds-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold text-slate-900">Components</h2>
          <div className="flex flex-col gap-2">
            {components.map((component) => (
              <button
                key={component.id}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', component.id);
                  setDragState({ type: 'component', componentId: component.id });
                }}
                onDragEnd={() => setDragState({ type: null })}
                onClick={() => handlePaletteClick(component)}
                className="rounded-xl border border-ds-border bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 transition hover:border-ds-primary hover:bg-white hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
              >
                <span className="font-semibold">{component.title}</span>
                {component.description ? (
                  <span className="block text-xs text-slate-500">{component.description}</span>
                ) : null}
              </button>
            ))}
            {components.length === 0 ? (
              <p className="rounded-lg border border-dashed border-ds-border bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                Components will appear here after the documentation build completes.
              </p>
            ) : null}
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="inline-flex items-center gap-1 rounded-md border border-ds-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" /> Undo
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  className="inline-flex items-center gap-1 rounded-md border border-ds-border bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
                >
                  <ArrowUturnRightIcon className="h-4 w-4" /> Redo
                </button>
              </div>
              <div className="text-xs text-slate-500">
                {saveState.status === 'saving'
                  ? 'Saving…'
                  : saveState.status === 'saved'
                    ? saveState.message
                    : isDirty
                      ? 'Unsaved changes'
                      : 'All changes saved'}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-ds-border bg-white p-6 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Page title</label>
            <input
              type="text"
              value={pageTitle}
              onChange={(event) => handleTitleChange(event.target.value)}
              placeholder="Enter a descriptive title for this page"
              className="mt-2 w-full rounded-lg border border-ds-border px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
            />
          </div>

          {isPreviewMode ? (
            previewPane
          ) : (
            <>
              {renderSectionDropZone(0, handleSectionDrop)}
              {editableSections.map((section, sectionIndex) => (
                <div key={section.id} className="space-y-4">
                  <section
                    className="rounded-2xl border border-ds-border bg-white p-5 shadow-sm"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleSectionDrop(sectionIndex)}
                  >
                    <div className="flex flex-col gap-3 border-b border-dashed border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500">
                        <button
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData('text/plain', section.id);
                            setDragState({ type: 'section', sectionId: section.id });
                          }}
                          onDragEnd={() => setDragState({ type: null })}
                          className="inline-flex items-center rounded-md border border-ds-border bg-white px-2 py-1 text-slate-500 shadow-sm transition hover:border-ds-primary hover:text-ds-primary"
                          aria-label="Drag to reorder section"
                        >
                          <Bars3Icon className="h-4 w-4" />
                        </button>
                        {editingSectionId === section.id ? (
                          <input
                            ref={sectionTitleInputRef}
                            value={sectionTitleDraft}
                            onChange={(event) => setSectionTitleDraft(event.target.value)}
                            onBlur={() =>
                              commitSectionTitle(
                                section.id,
                                sectionTitleDraft,
                                sectionTitleFallback || getSectionDisplayTitle(section, sectionIndex)
                              )
                            }
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                commitSectionTitle(
                                  section.id,
                                  sectionTitleDraft,
                                  sectionTitleFallback || getSectionDisplayTitle(section, sectionIndex)
                                );
                              } else if (event.key === 'Escape') {
                                event.preventDefault();
                                cancelSectionTitleEdit();
                              }
                            }}
                            className="w-44 rounded-md border border-ds-border px-2 py-1 text-xs font-semibold text-slate-600 focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                          />
                        ) : (
                          <button
                            type="button"
                            onDoubleClick={() => startEditingSectionTitle(section, sectionIndex)}
                            className="rounded px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                            title="Double-click to rename section"
                          >
                            {getSectionDisplayTitle(section, sectionIndex)}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfigSectionId((prev) => (prev === section.id ? null : section.id))}
                          className="inline-flex items-center rounded-md border border-ds-border bg-white px-2 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-ds-primary hover:text-ds-primary"
                          aria-label="Configure columns"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/admin/pages?focus=${encodeURIComponent(path)}&section=${section.id}`}
                          className="text-xs font-medium text-slate-400 underline-offset-2 hover:underline"
                        >
                          Inspect settings
                        </Link>
                      </div>
                    </div>

                    {configSectionId === section.id ? (
                      <div className="mt-4 space-y-4 rounded-xl border border-ds-border bg-slate-50 p-4">
                        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Columns (1–12)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={section.columns.length}
                          onChange={(event) => handleColumnCountChange(section.id, Number(event.target.value))}
                          className="mt-2 w-24 rounded-md border border-ds-border px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-ds-primary focus:outline-none focus:ring-2 focus:ring-ds-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveSection(section.id)}
                          className="inline-flex items-center gap-2 rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 shadow-sm transition hover:border-red-400 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" /> Delete section
                        </button>
                      </div>
                    ) : null}

                    <div className="mt-4 grid grid-cols-12 gap-4">
                      {section.columns.map((column) => {
                        const columnHasBlocks = column.blocks.length > 0;
                        return (
                          <div
                            key={column.id}
                            className="space-y-3 rounded-xl border border-ds-primary/40 bg-ds-primary/5 p-3 shadow-sm transition-colors hover:border-ds-primary/60"
                            style={{ gridColumn: `span ${column.span} / span ${column.span}` }}
                            onDragOver={(event) => event.preventDefault()}
                          >
                            <div className="text-xs font-semibold text-slate-500">Column span {column.span}</div>

                            {columnHasBlocks
                              ? renderBlockDropZone(section.id, column.id, 0, handleBlockDrop, () =>
                                  handleAddBlock(section.id, column.id, 0)
                                )
                              : null}
                            {columnHasBlocks ? (
                              column.blocks.map((block, blockIndex) => (
                                <div key={block.id} className="space-y-2">
                                  <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500">
                                    <button
                                      type="button"
                                      draggable
                                      onDragStart={(event) => {
                                    event.dataTransfer.setData('text/plain', block.id);
                                    setDragState({
                                      type: 'block',
                                      sectionId: section.id,
                                      columnId: column.id,
                                      blockId: block.id
                                    });
                                  }}
                                  onDragEnd={() => setDragState({ type: null })}
                                  className="inline-flex items-center rounded-md border border-ds-border bg-white px-2 py-1 text-slate-500 shadow-sm transition hover:border-ds-primary hover:text-ds-primary"
                                  aria-label="Drag to reorder block"
                                >
                                  <Bars3Icon className="h-3.5 w-3.5" />
                                </button>
                                <span>{block.kind === 'component' ? 'Component block' : 'Rich text block'}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlock(section.id, column.id, block.id)}
                                  className="inline-flex items-center rounded-md border border-red-200 bg-white px-2 py-1 text-red-600 transition hover:border-red-400 hover:text-red-700"
                                  aria-label="Delete block"
                                >
                                  <TrashIcon className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {block.kind === 'component' ? (
                                <div className="rounded-lg border border-dashed border-ds-border bg-white px-4 py-6 text-center text-sm text-slate-500">
                                  <p className="font-semibold text-slate-700">{block.componentId ?? 'Component'}</p>
                                  <p className="text-xs text-slate-500">Visual rendering coming soon.</p>
                                </div>
                              ) : (
                                <div
                                  ref={(element) => {
                                    if (element) {
                                      editorRefs.current.set(block.id, element);
                                      element.dataset.sectionId = section.id;
                                      element.dataset.columnId = column.id;
                                      element.dataset.blockId = block.id;
                                    } else {
                                      editorRefs.current.delete(block.id);
                                    }
                                  }}
                                  data-section-id={section.id}
                                  data-column-id={column.id}
                                  data-block-id={block.id}
                                  className="prose prose-slate min-h-[120px] rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-ds-primary focus:ring-2 focus:ring-ds-primary/20"
                                  contentEditable
                                  suppressContentEditableWarning
                                  onInput={(event) =>
                                    updateBlockHtml(section.id, column.id, block.id, (event.target as HTMLDivElement).innerHTML)
                                  }
                                  onBlur={(event) =>
                                    updateBlockHtml(section.id, column.id, block.id, (event.target as HTMLDivElement).innerHTML)
                                  }
                                />
                              )}

                                    {renderBlockDropZone(section.id, column.id, blockIndex + 1, handleBlockDrop, () =>
                                      handleAddBlock(section.id, column.id, blockIndex + 1)
                                    )}
                                </div>
                              ))
                            ) : (
                              <div
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={handleBlockDrop(section.id, column.id, 0)}
                                onDoubleClick={() => handleAddBlock(section.id, column.id)}
                                className="flex min-h-[160px] cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-blue-400 bg-blue-100/50 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-500"
                              >
                                Drag and drop components here
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  {renderSectionDropZone(sectionIndex + 1, handleSectionDrop)}
                </div>
              ))}
            </>
          )}

          <div ref={originalRef} className="sr-only" aria-hidden="true">
            {source}
          </div>
        </div>

        <aside className="self-start space-y-4 rounded-2xl border border-ds-border bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Actions</h3>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-ds-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-ds-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleAddSection}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-ds-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
            >
              <PlusIcon className="h-4 w-4" /> Add section
            </button>
            <button
              type="button"
              onClick={handlePreviewToggle}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-ds-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary"
            >
              <EyeIcon className="h-4 w-4" /> {isPreviewMode ? 'Back to editing' : 'Preview'}
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900">Version history</h3>
            <p className="text-xs text-slate-500">Restore a previous version of this page.</p>
            <select
              value={selectedVersionId ?? ''}
              onChange={(event) => setSelectedVersionId(event.target.value || null)}
              className="w-full rounded-md border border-ds-border bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-ds-primary focus:outline-none"
            >
              {versions.length === 0 ? (
                <option value="">No versions yet</option>
              ) : (
                versions.map((revision) => (
                  <option key={revision.id} value={revision.id}>
                    v{revision.version} · {new Date(revision.createdAt).toLocaleString()}
                  </option>
                ))
              )}
            </select>
            <button
              type="button"
              onClick={handleRestoreVersion}
              disabled={!selectedVersionId || isRestoring}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-ds-border bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-ds-primary hover:text-ds-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ds-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowPathIcon className="h-4 w-4" /> Restore version
            </button>
          </div>
        </aside>
      </div>

      {selectionToolbar.visible ? (
        <div
          className="fixed z-50 flex -translate-y-2 gap-1 rounded-full border border-ds-border bg-white px-2 py-1 shadow-lg"
          style={{ transform: 'translate(-50%, -100%)', top: selectionToolbar.y, left: selectionToolbar.x }}
        >
          <select
            defaultValue="heading-2"
            onMouseDown={(event) => event.preventDefault()}
            onChange={(event) => applyHeadingStyle(event.target.value as HeadingValue)}
            className="rounded-full border border-ds-border bg-white px-2 py-1 text-[11px] text-slate-600 focus:outline-none"
          >
            <option value="heading-2">H2</option>
            {HEADING_OPTIONS.filter((option) => option.value !== 'heading-2').map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {formattingActions.map((action) => (
            <button
              key={`floating-${action.label}`}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleToolbarAction(action.command, action.value, action.prompt === true)}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-ds-primary hover:text-white"
            >
              {action.icon}
            </button>
          ))}
        </div>
      ) : null}
      {toast}
    </div>
  );
}

function renderSectionDropZone(
  index: number,
  onDrop: (index: number) => (event: React.DragEvent<HTMLDivElement>) => void
) {
  return (
    <div
      key={`section-drop-${index}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop(index)}
      className="h-8 rounded-full border-2 border-dashed border-transparent transition-colors hover:border-ds-primary/40"
    />
  );
}

function renderBlockDropZone(
  sectionId: string,
  columnId: string,
  index: number,
  onDrop: (sectionId: string, columnId: string, index: number) => (event: React.DragEvent<HTMLDivElement>) => void,
  onDoubleClick?: () => void
) {
  return (
    <div
      key={`block-drop-${sectionId}-${columnId}-${index}`}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop(sectionId, columnId, index)}
      onDoubleClick={onDoubleClick}
      className="h-6 cursor-pointer rounded-full border-2 border-dashed border-blue-200 bg-blue-100/60 transition-colors hover:border-blue-300"
    />
  );
}

function normalizeForEditing(sections: PageSection[]): EditableSection[] {
  if (!sections || sections.length === 0) {
    return [createEmptySection()];
  }

  return sections.map((section) => {
    const columns = section.columns && section.columns.length > 0 ? section.columns : [createColumn(12, [createRichTextBlock('')])];
    return {
      id: section.id,
      title: section.title,
      columns: columns.map((column) => ({
        id: column.id,
        span: clampSpan(column.span ?? 12),
        blocks: column.blocks.map((block) => ({
          id: block.id,
          kind: block.kind,
          html: block.html,
          componentId: block.componentId,
          props: block.props ?? {}
        }))
      }))
    };
  });
}

function serializeSection(section: EditableSection): PageSection {
  return {
    id: section.id,
    title: section.title,
    columns: section.columns.map((column) => ({
      id: column.id,
      span: clampSpan(column.span),
      blocks: column.blocks.map((block) => ({
        id: block.id,
        kind: block.kind,
        html: block.html,
        componentId: block.componentId,
        props: block.props ?? {}
      }))
    }))
  };
}

function createEmptySection(): EditableSection {
  return {
    id: `section-${generateId()}`,
    title: '',
    columns: [createColumn(12, [createRichTextBlock('')])]
  };
}

function createSectionFromHtml(html: string): EditableSection {
  return {
    id: `section-${generateId()}`,
    title: '',
    columns: [createColumn(12, [createRichTextBlock(html)])]
  };
}

function createComponentSection(componentId: string): EditableSection {
  return {
    id: `section-${generateId()}`,
    title: '',
    columns: [createColumn(12, [createComponentBlock(componentId)])]
  };
}

function createColumn(span: number, blocks: EditableBlock[]): EditableColumn {
  return {
    id: `column-${generateId()}`,
    span: clampSpan(span),
    blocks: blocks.length > 0 ? blocks : [createRichTextBlock('')]
  };
}

function createRichTextBlock(html: string): EditableBlock {
  return {
    id: `block-${generateId()}`,
    kind: 'rich-text',
    html
  };
}

function createComponentBlock(componentId: string): EditableBlock {
  return {
    id: `block-${generateId()}`,
    kind: 'component',
    componentId,
    props: {}
  };
}

function redistributeColumns(columns: EditableColumn[], desiredCount: number): EditableColumn[] {
  const allBlocks = columns.flatMap((column) => column.blocks);
  const spans = calculateSpans(desiredCount);
  const nextColumns: EditableColumn[] = spans.map((span) => createColumn(span, []));

  allBlocks.forEach((block, index) => {
    const target = index % nextColumns.length;
    nextColumns[target].blocks.push(block);
  });

  return nextColumns;
}

function calculateSpans(count: number): number[] {
  const base = Math.floor(12 / count);
  const remainder = 12 - base * count;
  return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
}

function cloneSections(sections: EditableSection[]): EditableSection[] {
  return sections.map((section) => ({
    id: section.id,
    title: section.title,
    columns: section.columns.map((column) => ({
      id: column.id,
      span: column.span,
      blocks: column.blocks.map((block) => ({
        id: block.id,
        kind: block.kind,
        html: block.html,
        componentId: block.componentId,
        props: { ...(block.props ?? {}) }
      }))
    }))
  }));
}

function flattenSectionsToHtml(sections: EditableSection[]): string {
  return sections
    .map((section) =>
      section.columns
        .map((column) =>
          column.blocks
            .map((block) => (block.kind === 'component' ? `<div data-component="${block.componentId ?? ''}"></div>` : block.html ?? ''))
            .join('\n')
        )
        .join('\n')
    )
    .join('\n');
}

function arrayMove<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

function generateId(): string {
  if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function clampSpan(span: number): number {
  if (!Number.isFinite(span)) {
    return 12;
  }
  return Math.min(12, Math.max(1, Math.floor(span)));
}

function findBlockContext(node: Node): { sectionId: string | null; columnId: string | null; blockId: string | null } {
  let current: Node | null = node;
  while (current) {
    if (current instanceof HTMLElement && current.dataset.blockId) {
      if (!current.dataset.blockId) {
        current = current.parentNode;
        continue;
      }
      return {
        sectionId: current.dataset.sectionId ?? null,
        columnId: current.dataset.columnId ?? null,
        blockId: current.dataset.blockId ?? null
      };
    }
    current = current.parentNode;
  }
  return { sectionId: null, columnId: null, blockId: null };
}

function applyClassToSelection(className: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  let element = selection.focusNode as HTMLElement | null;
  while (element && element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }
  if (element) {
    element.classList.add(className);
  }
}

function removeClassFromSelection(className: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  let element = selection.focusNode as HTMLElement | null;
  while (element && element.nodeType === Node.TEXT_NODE) {
    element = element.parentElement;
  }
  if (element) {
    element.classList.remove(className);
  }
}
