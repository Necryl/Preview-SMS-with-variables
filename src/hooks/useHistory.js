import { useState, useCallback } from 'react';

const useHistory = (initialState) => {
    const [history, setHistory] = useState({
        past: [],
        present: initialState,
        future: []
    });

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const undo = useCallback(() => {
        setHistory((curr) => {
            if (curr.past.length === 0) return curr;

            const previous = curr.past[curr.past.length - 1];
            const newPast = curr.past.slice(0, curr.past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [curr.present, ...curr.future]
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((curr) => {
            if (curr.future.length === 0) return curr;

            const next = curr.future[0];
            const newFuture = curr.future.slice(1);

            return {
                past: [...curr.past, curr.present],
                present: next,
                future: newFuture
            };
        });
    }, []);

    const set = useCallback((newState) => {
        setHistory((curr) => {
            if (curr.present === newState) return curr;

            return {
                past: [...curr.past, curr.present],
                present: newState,
                future: []
            };
        });
    }, []);

    const reset = useCallback((newState) => {
        setHistory({
            past: [],
            present: newState,
            future: []
        });
    }, []);

    return {
        state: history.present,
        set,
        undo,
        redo,
        canUndo,
        canRedo,
        reset
    };
};

export default useHistory;
