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
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);

  function cancelHold() {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  }

  useEffect(() => () => cancelHold(), []);

  useEffect(() => {
    const tabList = tabListRef.current;
    if (!tabList) return;
    function preventActiveDragScroll(event: TouchEvent) {
      if (drag.current?.active && event.cancelable) event.preventDefault();
    }
    tabList.addEventListener("touchmove", preventActiveDragScroll, { passive: false });
    return () => tabList.removeEventListener("touchmove", preventActiveDragScroll);
  }, []);

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

  function startDrag(id: string, pointer: number, x: number, y: number, element: HTMLElement) {
    const bounds = element.getBoundingClientRect();
    drag.current = {
      id, pointer, x, y, offsetX: x - bounds.left, offsetY: y - bounds.top,
      width: bounds.width, active: false,
    };
  }

  function moveDrag(x: number, y: number) {
    const current = drag.current;
    if (!current?.active) return;
    setDragPreview({ id: current.id, x: x - current.offsetX, y: y - current.offsetY, width: current.width });
    const target = document.elementFromPoint(x, y)?.closest("[data-workbook-drop-id]");
    onExternalDrag?.(target?.getAttribute("data-workbook-drop-id") ?? null);
  }

  function endDrag(x: number, y: number, cancelled = false) {
    cancelHold();
    const current = drag.current;
    if (current?.active) {
      suppressClick.current = true;
      if (!cancelled) {
        const target = document.elementFromPoint(x, y)?.closest("[data-tab-id]");
        const targetId = target && tabListRef.current?.contains(target) ? target.getAttribute("data-tab-id") : null;
        const to = items.findIndex((entry) => entry.id === targetId);
        if (to >= 0) onMove(current.id, to);
        else {
          const workbookId = target?.closest("[data-workbook-drop-id]")?.getAttribute("data-workbook-drop-id");
          if (workbookId) onExternalDrop?.(current.id, workbookId);
        }
      }
    }
    drag.current = null;
    setDragPreview(null);
    onExternalDrag?.(null);
  }

  return (
    <div>
      <div ref={tabListRef} className="flex w-full min-w-0 max-w-full gap-1 overflow-x-auto px-4" role="tablist" aria-label={label}>
        {items.map((item, index) => (
          <div className={`flex shrink-0 items-center border-b-2 border-transparent ${dragPreview?.id === item.id ? "opacity-30" : ""} ${highlightedDropTarget === item.id ? "rounded-t-md bg-redDark/10" : ""}`} data-tab-id={item.id} data-workbook-drop-id={workbookDropTargets ? item.id : undefined} key={item.id}>
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
                className={`min-h-11 cursor-grab select-none border-b-2 px-3 py-2 text-sm font-semibold active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-redDark ${selectedId === item.id ? "border-redDark text-redDark" : "border-transparent text-black/55"}`}
                disabled={disabled || editing !== null}
                id={`${label === "Workbooks" ? "workbook-tab" : "sheet-tab"}-${item.id}`}
                onClick={() => {
                  if (suppressClick.current) { suppressClick.current = false; return; }
                  onSelect(item.id);
                }}
                onDoubleClick={() => beginEdit(item)}
                onPointerDown={(event) => {
                  if (event.pointerType === "touch" || event.button !== 0) return;
                  suppressClick.current = false;
                  startDrag(item.id, event.pointerId, event.clientX, event.clientY, event.currentTarget);
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  const current = drag.current;
                  if (event.pointerType === "touch" || !current || current.pointer !== event.pointerId) return;
                  if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 5) return;
                  current.active = true;
                  moveDrag(event.clientX, event.clientY);
                }}
                onPointerUp={(event) => {
                  if (event.pointerType !== "touch" && drag.current?.pointer === event.pointerId) endDrag(event.clientX, event.clientY);
                }}
                onPointerCancel={(event) => {
                  if (event.pointerType !== "touch" && drag.current?.pointer === event.pointerId) endDrag(event.clientX, event.clientY, true);
                }}
                onLostPointerCapture={(event) => {
                  if (event.pointerType !== "touch" && drag.current?.pointer === event.pointerId) endDrag(event.clientX, event.clientY, true);
                }}
                onTouchStart={(event) => {
                  if (event.touches.length !== 1) { endDrag(0, 0, true); return; }
                  cancelHold();
                  suppressClick.current = false;
                  const touch = event.touches[0];
                  startDrag(item.id, touch.identifier, touch.clientX, touch.clientY, event.currentTarget);
                  hold.current = setTimeout(() => {
                    hold.current = null;
                    if (!drag.current || drag.current.pointer !== touch.identifier) return;
                    drag.current.active = true;
                    moveDrag(touch.clientX, touch.clientY);
                  }, 500);
                }}
                onTouchMove={(event) => {
                  const current = drag.current;
                  if (!current) return;
                  const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === current.pointer);
                  if (!touch) return;
                  if (!current.active && Math.hypot(touch.clientX - current.x, touch.clientY - current.y) > 10) {
                    endDrag(touch.clientX, touch.clientY, true);
                    return;
                  }
                  moveDrag(touch.clientX, touch.clientY);
                }}
                onTouchEnd={(event) => {
                  const touch = Array.from(event.changedTouches).find((entry) => entry.identifier === drag.current?.pointer);
                  if (touch) endDrag(touch.clientX, touch.clientY);
                }}
                onTouchCancel={() => endDrag(0, 0, true)}
                onContextMenu={(event) => event.preventDefault()}
                onKeyDown={(event) => {
                  if (event.key === "F2") {
                    event.preventDefault();
                    beginEdit(item);
                  } else if (event.altKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
                    event.preventDefault();
                    onMove(item.id, Math.max(0, Math.min(items.length - 1, index + (event.key === "ArrowLeft" ? -1 : 1))));
                  }
                }}
                role="tab"
                title="Double-click or press F2 to rename; drag or use Alt+arrow keys to move"
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
          <span className="min-h-11 border-b-2 border-redDark px-3 py-2 text-redDark">
            {items.find((item) => item.id === dragPreview.id)?.name}
          </span>
        </div>,
        document.body,
      )}
    </div>
  );
}
