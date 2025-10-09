import { useState, useCallback, useRef, useEffect } from 'react';

interface UndoState<T> {
  previousValue: T | null;
  timeoutId: NodeJS.Timeout | null;
}

export const useUndo = <T>(duration = 30000) => {
  const [undoState, setUndoState] = useState<UndoState<T>>({
    previousValue: null,
    timeoutId: null,
  });

  // Store the undo callback
  const undoCallbackRef = useRef<(() => void) | null>(null);

  // Clear undo state
  const clearUndo = useCallback(() => {
    if (undoState.timeoutId) {
      clearTimeout(undoState.timeoutId);
    }
    setUndoState({ previousValue: null, timeoutId: null });
    undoCallbackRef.current = null;
  }, [undoState.timeoutId]);

  // Set up undo with previous value and callback
  const setupUndo = useCallback((previousValue: T, undoCallback: () => void) => {
    // Clear any existing timeout
    if (undoState.timeoutId) {
      clearTimeout(undoState.timeoutId);
    }

    // Set up new timeout
    const timeoutId = setTimeout(() => {
      setUndoState({ previousValue: null, timeoutId: null });
      undoCallbackRef.current = null;
    }, duration);

    setUndoState({ previousValue, timeoutId });
    undoCallbackRef.current = undoCallback;
  }, [duration, undoState.timeoutId]);

  // Execute undo
  const executeUndo = useCallback(() => {
    if (undoCallbackRef.current) {
      undoCallbackRef.current();
      clearUndo();
    }
  }, [clearUndo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (undoState.timeoutId) {
        clearTimeout(undoState.timeoutId);
      }
    };
  }, [undoState.timeoutId]);

  return {
    canUndo: undoState.previousValue !== null,
    previousValue: undoState.previousValue,
    setupUndo,
    executeUndo,
    clearUndo,
  };
};
