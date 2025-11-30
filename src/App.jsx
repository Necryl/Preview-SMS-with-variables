import Page from "./Page";
import "./App.css";

import { useState, useEffect, useCallback } from "react";
import { usePrompt } from "./Prompt.jsx";
import Settings from "./Settings.jsx";
import About from "./About.jsx";
import useHistory from "./hooks/useHistory";

import { migrateVariables } from "./utils";
import { VscPinned } from "react-icons/vsc";
import { MdPushPin, MdClose, MdAdd, MdRefresh, MdSettings, MdUndo, MdRedo, MdHelpOutline } from "react-icons/md";

import { DEFAULT_SETTINGS } from "./config";

if (!DEFAULT_SETTINGS.variablePlaceholder) {
  throw new Error("DEFAULT_SETTINGS.variablePlaceholder cannot be empty. Please check src/config.js");
}

function App() {
  // Initial State Loading
  const loadInitialState = () => {
    const savedTabs = JSON.parse(localStorage.getItem("tabs")) || {};
    const savedCurrentTab = JSON.parse(localStorage.getItem("currentTab")) || 0;

    // Load data for all tabs
    const tabData = {};
    Object.keys(savedTabs).forEach(tabId => {
      const data = localStorage.getItem(tabId);
      if (data) {
        try {
          tabData[tabId] = JSON.parse(data);
        } catch (e) {
          console.error(`Failed to load data for tab ${tabId}`, e);
        }
      }
    });

    // Ensure at least one tab exists if empty
    let initialTabs = savedTabs;
    let initialCurrentTab = savedCurrentTab;

    if (Object.keys(initialTabs).length === 0) {
      initialTabs = { 1: { title: "SMS 1", pinned: false } };
      initialCurrentTab = 1;
    }

    return {
      tabs: initialTabs,
      currentTab: initialCurrentTab,
      tabData: tabData
    };
  };

  const { state, set, undo, redo, canUndo, canRedo, reset } = useHistory(loadInitialState());

  // Settings State (kept separate from history as settings changes shouldn't necessarily be undoable in the same stack, or maybe they should? User said "reset button" is exception. Let's keep settings separate for now as it's global config)
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("appSettings");
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem("appSettings", JSON.stringify(settings));
  }, [settings]);

  // Persist State to LocalStorage
  useEffect(() => {
    // Save Tabs
    localStorage.setItem("tabs", JSON.stringify(state.tabs));
    localStorage.setItem("currentTab", JSON.stringify(state.currentTab));

    // Save Tab Data
    // We only need to save the data that exists in state.tabData
    // But we should also clean up data for deleted tabs? 
    // The history state might contain data for deleted tabs if we undo? 
    // Actually, if we delete a tab, we remove it from tabs map.
    // Let's iterate through state.tabs to save active ones.

    Object.keys(state.tabs).forEach(tabId => {
      if (state.tabData[tabId]) {
        localStorage.setItem(tabId, JSON.stringify(state.tabData[tabId]));
      }
    });

    // Clean up orphaned data in localStorage? 
    // Maybe not aggressively, to avoid data loss if something goes wrong.
    // But strictly speaking, if it's not in tabs, it shouldn't be accessible.
    // For now, let's just save what we have.

  }, [state]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            redo();
          }
        } else {
          if (canUndo) {
            e.preventDefault();
            undo();
          }
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        if (canRedo) {
          e.preventDefault();
          redo();
        }
      } else if (e.key === 'Escape') {
        // Toggle settings on Escape, do NOT preventDefault as per user request
        if (showSettings) setShowSettings(false);
        if (showAbout) setShowAbout(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  // Keyboard Shortcuts for Tab Management
  useEffect(() => {
    const handleTabShortcuts = (e) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'w':
            e.preventDefault();
            removeTab(state.currentTab);
            break;
          case 'a':
            e.preventDefault();
            createTab();
            break;
          case 'arrowleft':
            if (e.shiftKey) {
              e.preventDefault();
              {
                const tabIds = Object.keys(state.tabs).map(Number);
                const currentIndex = tabIds.indexOf(Number(state.currentTab));
                if (currentIndex > 0) {
                  set({ ...state, currentTab: tabIds[currentIndex - 1] });
                }
              }
            }
            break;
          case 'arrowright':
            if (e.shiftKey) {
              e.preventDefault();
              {
                const tabIds = Object.keys(state.tabs).map(Number);
                const currentIndex = tabIds.indexOf(Number(state.currentTab));
                if (currentIndex < tabIds.length - 1) {
                  set({ ...state, currentTab: tabIds[currentIndex + 1] });
                }
              }
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleTabShortcuts);
    return () => window.removeEventListener('keydown', handleTabShortcuts);
  }, [state, set]);


  const handleApplySettings = (newSettings) => {
    // Check if placeholder changed to trigger migration
    if (newSettings.variablePlaceholder !== settings.variablePlaceholder) {
      const oldPlaceholder = settings.variablePlaceholder;
      const newPlaceholder = newSettings.variablePlaceholder;

      // We need to update state.tabData with migrated values
      const newTabData = { ...state.tabData };
      let hasChanges = false;

      Object.keys(state.tabs).forEach(tabId => {
        const data = newTabData[tabId];
        if (data && data.input) {
          try {
            const { newInput, newVariableValues } = migrateVariables(
              data.input,
              oldPlaceholder,
              newPlaceholder,
              data.variableValues || {}
            );
            newTabData[tabId] = {
              ...data,
              input: newInput,
              variableValues: newVariableValues
            };
            hasChanges = true;
          } catch (e) {
            console.error(`Failed to migrate tab ${tabId}`, e);
          }
        }
      });

      if (hasChanges) {
        set({
          ...state,
          tabData: newTabData
        });
      }
    }

    setSettings(newSettings);
    setShowSettings(false);
  };

  // Tab Management Functions
  function createTab() {
    const keys = Object.keys(state.tabs);
    const id = Number(keys.length) > 0 ? Number(keys[keys.length - 1]) + 1 : 1;

    set({
      ...state,
      tabs: { ...state.tabs, [id]: { title: `SMS ${id}`, pinned: false } },
      currentTab: id,
      // Initialize empty data for new tab to avoid null checks later
      tabData: {
        ...state.tabData,
        [id]: {
          input: "",
          variableCount: 0,
          variableValues: { ["T" + id + "I0"]: { id: "T" + id + "I0", data: [] } },
          templateId: "",
          notes: "",
          instanceCounter: 1
        }
      }
    });
  }

  function removeTab(id) {
    if (state.tabs[id]?.pinned) return;

    const newTabs = { ...state.tabs };
    delete newTabs[id];

    // Determine new current tab
    let newCurrentTab = state.currentTab;
    if (Number(state.currentTab) === Number(id)) {
      const keys = Object.keys(newTabs);
      if (keys.length > 0) {
        // Try to go to previous tab, or next if first was deleted
        // Logic from original:
        // if (keys.indexOf(id.toString()) == keys.length - 1) ... wait, keys is newTabs keys, id is gone.
        // Let's just pick the last one or first one.
        // Original logic was a bit complex relying on index in old array.
        // Simple logic: pick the last available tab.
        newCurrentTab = Number(keys[keys.length - 1]);
      } else {
        // Should not happen as we prevent deleting last tab usually, or create new one?
        // Original code: if (Object.keys(result).length > 1) ...
        // If it was the last tab, we might end up with empty tabs?
        // Original createTab check: if (Object.keys(tabs).length === 0) createTab();
        // We should handle that.
      }
    }

    // Also remove data?
    const newTabData = { ...state.tabData };
    // delete newTabData[id]; // Optional: keep data in history? Yes, if we undo, we want it back.
    // But for the *current* state, we can keep it or remove it. 
    // If we remove it from tabs, user can't access it.
    // If we undo, we restore tabs AND tabData.

    const newState = {
      ...state,
      tabs: newTabs,
      currentTab: newCurrentTab
    };

    if (Object.keys(newTabs).length === 0) {
      // If all tabs closed, create a new one
      const newId = 1;
      newState.tabs = { [newId]: { title: `SMS ${newId}`, pinned: false } };
      newState.currentTab = newId;
      newState.tabData = {
        ...newState.tabData,
        [newId]: {
          input: "",
          variableCount: 0,
          variableValues: { ["T" + newId + "I0"]: { id: "T" + newId + "I0", data: [] } },
          templateId: "",
          notes: "",
          instanceCounter: 1
        }
      };
    }

    set(newState);
    localStorage.removeItem(id); // Clean up storage for this tab
  }

  function togglePin(id) {
    if (state.tabs[id]) {
      set({
        ...state,
        tabs: {
          ...state.tabs,
          [id]: { ...state.tabs[id], pinned: !state.tabs[id].pinned }
        }
      });
    }
  }

  function setTabTitle(id, title) {
    if (state.tabs[id]) {
      set({
        ...state,
        tabs: {
          ...state.tabs,
          [id]: { ...state.tabs[id], title: title }
        }
      });
    }
  }

  // Page Data Update Handler
  const handlePageUpdate = useCallback((newData) => {
    let newTabs = state.tabs;

    // If title is provided in the update, update the tab title as well
    if (newData.title !== undefined) {
      newTabs = {
        ...state.tabs,
        [state.currentTab]: { ...state.tabs[state.currentTab], title: newData.title }
      };
    }

    set({
      ...state,
      tabs: newTabs,
      tabData: {
        ...state.tabData,
        [state.currentTab]: newData
      }
    });
  }, [state, set]);

  const { showPrompt } = usePrompt();

  return (
    <div id="App">
      <Settings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onApply={handleApplySettings}
      />
      <About
        isOpen={showAbout}
        onClose={() => setShowAbout(false)}
      />
      <div className="app-header">
        <h1 className="app-title">Preview SMS with Variables</h1>
        <div className="header-controls">
          <button
            className="icon-btn"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <MdUndo />
          </button>
          <button
            className="icon-btn"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            <MdRedo />
          </button>
          <button
            id="reset"
            onClick={async () => {
              const result = await showPrompt("Are you sure you want to reset everything?", [
                { label: "Cancel", value: "Cancel", risk: "low" },
                { label: "Confirm", value: "Confirm", risk: "high" }
              ]);
              if (result === "Confirm") {
                // Smart Reset Logic - similar to before but using history reset
                const pinnedTabs = {};
                const pinnedTabsData = {};

                Object.keys(state.tabs).forEach(tabId => {
                  if (state.tabs[tabId].pinned) {
                    pinnedTabs[tabId] = state.tabs[tabId];
                    const data = state.tabData[tabId];
                    if (data) {
                      // Filter pinned instances
                      let newVariableValues = {};
                      if (data.variableValues) {
                        Object.keys(data.variableValues).forEach(instanceId => {
                          if (data.variableValues[instanceId].pinned) {
                            newVariableValues[instanceId] = data.variableValues[instanceId];
                          }
                        });
                      }
                      pinnedTabsData[tabId] = { ...data, variableValues: newVariableValues };
                    }
                  }
                });

                localStorage.clear();
                // Restore settings
                localStorage.setItem("appSettings", JSON.stringify(settings));

                let newTabs = pinnedTabs;
                let newTabData = pinnedTabsData;
                let newCurrentTab = Object.keys(pinnedTabs).length > 0 ? Number(Object.keys(pinnedTabs)[0]) : 1;

                if (Object.keys(newTabs).length === 0) {
                  newTabs = { 1: { title: "SMS 1", pinned: false } };
                  newTabData = {
                    1: {
                      input: "",
                      variableCount: 0,
                      variableValues: { "T1I0": { id: "T1I0", data: [] } },
                      templateId: "",
                      notes: "",
                      instanceCounter: 1
                    }
                  };
                  newCurrentTab = 1;
                }

                reset({
                  tabs: newTabs,
                  currentTab: newCurrentTab,
                  tabData: newTabData
                });

                // Force reload not needed if we update state correctly, but maybe safer to ensure clean slate?
                // The user prompt said "except for the reset button", implying reset should probably clear history.
                // My reset function in useHistory clears history.
              }
            }}
          >
            <MdRefresh /> Reset
          </button>
          <button
            id="settings"
            onClick={() => setShowSettings(true)}
          >
            <MdSettings /> Settings
          </button>
          <button
            className="icon-btn"
            onClick={() => setShowAbout(true)}
            title="About"
          >
            <MdHelpOutline />
          </button>
        </div>
      </div>
      <div id="nav">
        {Object.keys(state.tabs).map((key, i) => (
          <button
            className={`tab ${state.tabs[key].pinned ? 'pinned' : ''} ${Number(state.currentTab) === Number(key) ? 'active' : ''}`}
            onClick={() => set({ ...state, currentTab: Number(key) })}
            key={i}
          >
            <span
              className="pin-btn"
              onClick={(e) => {
                e.stopPropagation();
                togglePin(key);
              }}
            >
              {state.tabs[key].pinned ? <MdPushPin /> : <VscPinned />}
            </span>
            <span className="tab-title">{state.tabs[key].title}</span>{" "}
            <span className="pin-btn dummy">
              <MdPushPin />
            </span>
            {!state.tabs[key].pinned && (
              <span
                className="close-tab-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTab(key);
                }}
              >
                <MdClose />
              </span>
            )}
          </button>
        ))}
        <button
          className="addTabBtn"
          onClick={() => {
            createTab();
          }}
        >
          <MdAdd />
        </button>
        <div className="flex-spacer"></div>
      </div>
      <Page
        dataId={Number(state.currentTab)}
        setTitle={(title) => setTabTitle(state.currentTab, title)}
        title={state.tabs[state.currentTab] ? state.tabs[state.currentTab].title : "loading..."}
        settings={settings}
        data={state.tabData[state.currentTab] || {}}
        onUpdate={handlePageUpdate}
      />
    </div>
  );
}

export default App;
