"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Item = { id: string; name: string };

export default function EditableTabs({ items, selectedId, label, disabled, maxLength, onSelect, onRename, onMove, onEditingChange, trailingAction, workbookDropTargets, highlightedDropTarget, onExternalDrag, onExternalDrop }: {
  items: Item[];
  selectedId: string | null;
  label: string;
  disabled: boolean;
  maxLength: number;
  onSelect: (id: string) => void;
  onRename: (id: string, name: string) => string | null;
  onMove: (id: string, to: number) => void;
  onEditingChange: (editing: boolean) => void;
  trailingAction?: ReactNode;
  workbookDropTargets?: boolean;
  highlightedDropTarget?: string | null;
  onExternalDrag?: (workbookId: string | null) => void;
  onExternalDrop?: (id: string, workbookId: string) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const drag = useRef<{ id: string; pointer: number; x: number; y: number; offsetX: number; offsetY: number; width: number; active: boolean } | null>(null);
  const [dragPreview, setDragPreview] = useState<{ id: string; x: number; y: number; width: number } | null>(null);
  const tabListRef = useRef<HTMLDivElement>(null);
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; y: number } | null>(null);

  function cancelHold() {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  }

  useEffect(() => () => cancelHold(), []);

  function finish() {
    if (!editing) return;
    const message = onRename(editing, value.trim());
    if (message) {
      setError(message);
      return;
    }
    setEditing(null);
    onEditingChange(false);
    setError("");
  }

  function beginEdit(item: Item) {
    setValue(item.name);
    setEditing(item.id);
    onEditingChange(true);
  }

  return (
    <div>
      <div ref={tabListRef} className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto px-4" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <div className={`flex shrink-0 items-center border-b-2 border-transparent ${dragPreview?.id === item.id ? "opacity-30" : ""} ${highlightedDropTarget === item.id ? "rounded-t-md bg-redDark/10" : ""}`} data-tab-id={item.id} data-workbook-drop-id={workbookDropTargets ? item.id : undefined} key={item.id}>
            <button
              aria-label={`Move ${item.name}; use left and right arrow keys`}
              className="touch-none cursor-grab rounded px-2 py-3 text-black/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark disabled:opacity-40"
              disabled={disabled || editing !== null}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                const bounds = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!bounds) return;
                drag.current = {
                  id: item.id, pointer: event.pointerId, x: event.clientX, y: event.clientY,
                  offsetX: event.clientX - bounds.left, offsetY: event.clientY - bounds.top,
                  width: bounds.width, active: false,
                };
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                const current = drag.current;
                if (!current || current.pointer !== event.pointerId) return;
                if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
                current.active = true;
                setDragPreview({ id: current.id, x: event.clientX - current.offsetX, y: event.clientY - current.offsetY, width: current.width });
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-workbook-drop-id]");
                onExternalDrag?.(target?.getAttribute("data-workbook-drop-id") ?? null);
              }}
              onPointerUp={(event) => {
                const current = drag.current;
                if (!current || current.pointer !== event.pointerId) return;
                const target = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-tab-id]");
                const targetId = target && tabListRef.current?.contains(target) ? target.getAttribute("data-tab-id") : null;
                const to = items.findIndex((entry) => entry.id === targetId);
                if (current.active && to >= 0) onMove(current.id, to);
                else if (current.active) {
                  const workbook = target?.closest("[data-workbook-drop-id]");
                  const workbookId = workbook?.getAttribute("data-workbook-drop-id");
                  if (workbookId) onExternalDrop?.(current.id, workbookId);
                }
                drag.current = null;
                setDragPreview(null);
                onExternalDrag?.(null);
              }}
              onPointerCancel={() => { drag.current = null; setDragPreview(null); onExternalDrag?.(null); }}
              onLostPointerCapture={() => { drag.current = null; setDragPreview(null); onExternalDrag?.(null); }}
              onKeyDown={(event) => {
                if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                  event.preventDefault();
                  onMove(item.id, Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowLeft" ? -1 : 1))));
                }
              }}
              type="button"
            >
              &#8942;&#8942;
            </button>
            {editing === item.id ? (
              <input
                aria-label={`Rename ${label}`}
                autoFocus
                className="my-1 w-40 rounded border border-black/30 px-2 py-2 text-sm"
                maxLength={maxLength}
                onBlur={finish}
                onChange={(event) => { setValue(event.target.value); setError(""); }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); finish(); }
                  if (event.key === "Escape") { setEditing(null); setError(""); onEditingChange(false); }
                }}
                value={value}
              />
            ) : (
              <button
                aria-controls={`${label === "Workbooks" ? "workbook-panel" : "sheet-panel"}-${item.id}`}
                aria-selected={selectedId === item.id}
                className={`min-h-11 select-none border-b-2 px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark ${selectedId === item.id ? "border-redDark text-redDark" : "border-transparent text-black/55"}`}
                disabled={disabled || editing !== null}
                id={`${label === "Workbooks" ? "workbook-tab" : "sheet-tab"}-${item.id}`}
                onClick={() => onSelect(item.id)}
                onDoubleClick={() => beginEdit(item)}
                onPointerDown={(event) => {
                  if (event.pointerType !== "touch") return;
                  cancelHold();
                  hold.current = {
                    x: event.clientX,
                    y: event.clientY,
                    timer: setTimeout(() => { hold.current = null; beginEdit(item); }, 600),
                  };
                }}
                onPointerMove={(event) => {
                  if (hold.current && Math.hypot(event.clientX - hold.current.x, event.clientY - hold.current.y) > 10) cancelHold();
                }}
                onPointerUp={cancelHold}
                onPointerCancel={cancelHold}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === "F2") {
                    event.preventDefault();
                    beginEdit(item);
                  }
                }}
                role="tab"
                title="Double-click, hold, or press F2 to rename"
                type="button"
              >
                {item.name}
              </button>
            )}
          </div>
        ))}
        {trailingAction}
      </div>
      {error && <p className="px-4 pb-2 text-sm text-redDark" role="alert">{error}</p>}
      {dragPreview && createPortal(
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[100] flex items-center rounded-md border border-black/10 bg-white text-sm font-semibold shadow-lg"
          style={{ left: dragPreview.x, top: dragPreview.y, width: dragPreview.width }}
        >
          <span className="px-2 py-3 text-black/50">&#8942;&#8942;</span>
          <span className="min-h-11 border-b-2 border-redDark px-3 py-2 text-redDark">
            {items.find((item) => item.id === dragPreview.id)?.name}
          </span>
        </div>,
        document.body,
      )}
    </div>
  );
}
