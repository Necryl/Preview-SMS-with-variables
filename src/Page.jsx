import React, { useState, useRef, useEffect } from "react";
import Instance from "./Instance.jsx";
import { MdContentCopy, MdVisibility, MdVisibilityOff, MdAddCircleOutline, MdClose } from "react-icons/md";
import { VscJson } from "react-icons/vsc";
import { PiCornersOut } from "react-icons/pi";
import "./Page.css";
import "./Notification.css";
import NotificationContainer from './NotificationContainer';
import PropTypes from "prop-types";
import { migrateVariables } from "./utils";

function Page({ dataId, setTitle, title, settings, data, onUpdate }) {
  // Destructure data with default values
  const {
    input = "",
    variableCount = 0,
    variableValues = {},
    templateId = "",
    notes = "",
    instanceCounter = 0
  } = data || {};

  // Track cursor position/selection
  const lastSelection = useRef({ start: 0, end: 0 });

  // NEW: Track selected instance
  const [selectedInstanceId, setSelectedInstanceId] = useState(null);

  // NEW: Track copied variables for highlighting
  // Structure: { [instanceId]: { [variableIndex]: boolean } }
  const [copiedVariables, setCopiedVariables] = useState({});

  // NEW: Ref for scroll container
  const scrollContainerRef = useRef(null);
  // NEW: Track previous instance count to detect additions
  const prevInstanceCount = useRef(0);

  // Helper to update parent state
  const updateState = (updates) => {
    onUpdate({
      input,
      variableCount,
      variableValues,
      templateId,
      notes,
      instanceCounter,
      ...updates
    });
  };

  // Track previous state for diffing
  const previousState = useRef({
    text: input,
    selection: { start: 0, end: 0 },
    placeholder: settings?.variablePlaceholder || "{#var#}"
  });

  // Update previousState when data changes externally (e.g. undo/redo)
  useEffect(() => {
    previousState.current.text = input;
    previousState.current.placeholder = settings?.variablePlaceholder || "{#var#}";
  }, [input, settings?.variablePlaceholder]);


  function deleteInstance(id) {
    const instanceIds = Object.keys(variableValues);
    if (instanceIds.length <= 1) {
      addNotification("Cannot delete the last instance", "medium");
      return;
    }

    // Determine next selection
    let nextId = null;
    if (selectedInstanceId === id) {
      const index = instanceIds.indexOf(id);
      if (index !== -1) {
        if (index + 1 < instanceIds.length) {
          nextId = instanceIds[index + 1]; // Prioritize bottom (next)
        } else if (index - 1 >= 0) {
          nextId = instanceIds[index - 1]; // Fallback to top (prev)
        }
      }
    }

    let result = { ...variableValues };
    delete result[id];

    updateState({ variableValues: result });

    // Update selection
    if (selectedInstanceId === id) {
      setSelectedInstanceId(nextId);
      if (nextId) {
        wasShortcutNavigation.current = true;
      }
    }
  }

  function handleSelectionUpdate(e) {
    previousState.current.selection = {
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    };
  }

  function calculateVariableChanges(prevText, currText, prevPlaceholder, currPlaceholder, selectionRange) {
    // Helper to escape regex special characters
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const prevPlaceholderRegex = new RegExp(escapeRegExp(prevPlaceholder), 'g');
    const currPlaceholderRegex = new RegExp(escapeRegExp(currPlaceholder), 'g');

    // 1. Find Common Prefix
    // Constrain by selection start if available (this prevents greedy matching across the insertion point)
    let commonPrefixLen = 0;
    const maxPrefixLen = selectionRange ? selectionRange.start : prevText.length;
    const minLen = Math.min(prevText.length, currText.length);

    while (
      commonPrefixLen < minLen &&
      commonPrefixLen < maxPrefixLen &&
      prevText[commonPrefixLen] === currText[commonPrefixLen]
    ) {
      commonPrefixLen++;
    }

    // 2. Find Common Suffix
    // Constrain by selection end if available
    let commonSuffixLen = 0;
    const maxSuffixLen = selectionRange ? (prevText.length - selectionRange.end) : prevText.length;

    while (
      commonSuffixLen < minLen - commonPrefixLen &&
      commonSuffixLen < maxSuffixLen &&
      prevText[prevText.length - 1 - commonSuffixLen] === currText[currText.length - 1 - commonSuffixLen]
    ) {
      commonSuffixLen++;
    }

    // 3. Define Volatile Zones
    const prefix = prevText.substring(0, commonPrefixLen);
    const suffix = prevText.substring(prevText.length - commonSuffixLen);

    // 4. Count Variables in Stable Zones
    // We use prevPlaceholder because these zones are derived from the previous text state
    const varsBefore = (prefix.match(prevPlaceholderRegex) || []).length;
    const varsAfter = (suffix.match(prevPlaceholderRegex) || []).length;

    // 5. Calculate Variables in Volatile Zones
    const totalVarsPrev = (prevText.match(prevPlaceholderRegex) || []).length;
    const totalVarsCurr = (currText.match(currPlaceholderRegex) || []).length;

    const varsRemoved = totalVarsPrev - varsBefore - varsAfter;
    const varsAdded = totalVarsCurr - varsBefore - varsAfter;

    return { varsBefore, varsRemoved, varsAdded };
  }

  function synchronizeVariables(varsBefore, varsRemoved, varsAdded, newText) {
    // Calculate new variable count
    const placeholder = settings?.variablePlaceholder || "{#var#}";
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const placeholderRegex = new RegExp(escapeRegExp(placeholder), 'g');
    const newVariableCount = (newText.match(placeholderRegex) || []).length;

    if (varsRemoved === 0 && varsAdded === 0) {
      updateState({ input: newText, variableCount: newVariableCount });
      return;
    }

    const newValues = { ...variableValues };
    Object.keys(newValues).forEach((key) => {
      const currentData = [...newValues[key].data];

      // 1. Identify variables before the change (untouched)
      const varsToKeepBefore = currentData.slice(0, varsBefore);

      // 2. Identify variables in the affected range (removed/replaced)
      const varsInAffectedRange = currentData.slice(varsBefore, varsBefore + varsRemoved);

      // 3. Identify variables after the change (untouched)
      const varsToKeepAfter = currentData.slice(varsBefore + varsRemoved);

      // 4. Determine new variables for the affected range
      let newVars = [];
      if (varsAdded > 0) {
        // If we added variables, try to reuse existing values from the affected range
        // Take as many as we can from what was removed
        const reusedVars = varsInAffectedRange.slice(0, varsAdded);

        // If we need more than we removed, fill with empty strings
        const extraNeeded = varsAdded - reusedVars.length;
        const extraVars = Array(Math.max(0, extraNeeded)).fill("");

        newVars = [...reusedVars, ...extraVars];
      }
      // If varsAdded is 0, newVars is empty (effectively deleting the removed vars)

      // 5. Reassemble
      newValues[key] = {
        ...newValues[key],
        data: [...varsToKeepBefore, ...newVars, ...varsToKeepAfter],
      };
    });

    updateState({
      input: newText,
      variableValues: newValues,
      variableCount: newVariableCount
    });

    // Handle copied variables highlighting update (local state)
    setCopiedVariables((prev) => {
      const newCopiedState = {};

      // Only iterate over instances that actually have highlights
      Object.keys(prev).forEach((instanceId) => {
        const oldHighlights = prev[instanceId];
        const newHighlights = {};

        Object.keys(oldHighlights).forEach((key) => {
          const oldIndex = parseInt(key);

          if (oldIndex < varsBefore) {
            // Before the change: keep as is
            newHighlights[oldIndex] = true;
          } else if (oldIndex >= varsBefore && oldIndex < varsBefore + varsRemoved) {
            // In the affected range (removed/replaced)
            // Check if this index is "reused"
            const offsetInAffected = oldIndex - varsBefore;
            if (offsetInAffected < varsAdded) {
              // It is reused. The index remains the same relative to varsBefore.
              newHighlights[oldIndex] = true;
            }
          } else {
            // After the change (oldIndex >= varsBefore + varsRemoved)
            // Shift by (varsAdded - varsRemoved)
            const newIndex = oldIndex - varsRemoved + varsAdded;
            newHighlights[newIndex] = true;
          }
        });

        if (Object.keys(newHighlights).length > 0) {
          newCopiedState[instanceId] = newHighlights;
        }
      });

      return newCopiedState;
    });
  }

  function processTextChange(newText) {
    const prevText = previousState.current.text;
    const prevPlaceholder = previousState.current.placeholder || "{#var#}";
    const currPlaceholder = settings?.variablePlaceholder || "{#var#}";
    const selectionRange = previousState.current.selection;

    const { varsBefore, varsRemoved, varsAdded } = calculateVariableChanges(
      prevText,
      newText,
      prevPlaceholder,
      currPlaceholder,
      selectionRange
    );

    synchronizeVariables(varsBefore, varsRemoved, varsAdded, newText);

    previousState.current.text = newText;
    previousState.current.placeholder = currPlaceholder;
  }

  function handleSMSinput(e) {
    processTextChange(e.target.value);
  }

  function onVarChange(id, vars) {
    const result = { ...variableValues };
    if (result[id]) {
      result[id] = { ...result[id], data: vars };
    }
    updateState({ variableValues: result });
  }

  function handleClearCopied(instanceId, varIndex) {
    setCopiedVariables(prev => {
      if (!prev[instanceId] || !prev[instanceId][varIndex]) return prev;

      const newInstanceCopied = { ...prev[instanceId] };
      delete newInstanceCopied[varIndex];

      // If no more copied vars for this instance, remove the instance key
      if (Object.keys(newInstanceCopied).length === 0) {
        const newPrev = { ...prev };
        delete newPrev[instanceId];
        return newPrev;
      }

      return {
        ...prev,
        [instanceId]: newInstanceCopied
      };
    });
  }

  function createNewInstance(forceEmpty = false) {
    let initialData = [];
    if (!forceEmpty && selectedInstanceId && variableValues[selectedInstanceId]) {
      // Copy data from selected instance
      initialData = [...variableValues[selectedInstanceId].data];
    }

    const newId = "T" + dataId + "I" + instanceCounter;
    const newInstance = {
      id: newId,
      data: initialData.concat(Array(Math.max(variableCount - initialData.length, 0)).fill("")),
    };

    const result = { ...variableValues };
    result[newId] = newInstance;

    updateState({
      variableValues: result,
      instanceCounter: instanceCounter + 1
    });

    // If we copied data, mark variables as copied
    if (selectedInstanceId && variableValues[selectedInstanceId]) {
      const newCopiedState = {};
      initialData.forEach((val, index) => {
        if (val && val.trim() !== "") {
          newCopiedState[index] = true;
        }
      });

      setCopiedVariables(prev => ({
        ...prev,
        [newId]: newCopiedState
      }));
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard:", text);
        addNotification(text, 'positive');
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function replacePlaceholders(text, values) {
    let index = 0; // To keep track of the array index
    const placeholder = settings?.variablePlaceholder || "{#var#}";
    const escapeRegExp = (string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    const placeholderRegex = new RegExp(escapeRegExp(placeholder), 'g');

    // Replace each placeholder with the next value in the array, if available
    return text.replace(placeholderRegex, () => values[index++] || "");
  }
  const resultText = Object.keys(variableValues).map((instance) =>
    replacePlaceholders(input, variableValues[instance].data),
  );

  const textareaRef = useRef(null);
  const titleInputRef = useRef(null);

  const handleInsertVariable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const variable = settings?.variablePlaceholder || "{#var#}";

    // Update our internal state to match current DOM state before processing
    previousState.current.selection = { start, end };
    previousState.current.text = text;
    previousState.current.placeholder = settings?.variablePlaceholder || "{#var#}";

    // Construct new text
    let newText = "";
    if (start !== end) {
      const selectedText = text.substring(start, end);
      copyToClipboard(selectedText);
      newText = text.substring(0, start) + variable + text.substring(end);
    } else {
      newText = text.substring(0, start) + variable + text.substring(start);
    }

    // Use the unified logic to process the change
    processTextChange(newText);

    textarea.focus();

    // Update selection
    const newCursorPos = start + variable.length;
    previousState.current.selection = { start: newCursorPos, end: newCursorPos };

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newCursorPos;
      }
    }, 0);
  };

  const [showResult, setShowResult] = useState(false);
  const [showLLMView, setShowLLMView] = useState(false);
  const [jsonContent, setJsonContent] = useState("");

  // NEW: State for notifications
  const [notifications, setNotifications] = useState([]);

  // NEW: Function to add a notification
  const addNotification = (text, risk = 'low') => {
    const id = Date.now();
    let displayMessage = text;
    if (risk === 'positive') {
      displayMessage = `Copied: ${text}`;
    }

    setNotifications(prev => {
      const updated = [{ id, text: displayMessage, fading: false, risk }, ...prev].slice(0, 2);
      return updated;
    });

    setTimeout(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, fading: true } : n));
    }, 4500);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // NEW: useEffect for copy event listener
  useEffect(() => {
    const handleCopy = (e) => {
      const selection = document.getSelection();
      if (selection && selection.toString().length > 0) {
        addNotification(selection.toString(), 'positive');
      }
    };

    window.addEventListener('copy', handleCopy);
    return () => window.removeEventListener('copy', handleCopy);
  }, []);

  const [flashingComponent, setFlashingComponent] = useState(null);

  const triggerFlash = (id) => {
    setFlashingComponent(id);
    setTimeout(() => setFlashingComponent(null), 400);
  };

  const handleOpenLLMView = () => {
    setShowLLMView(true);
    setShowResult(false); // Ensure result view is closed
  };

  // NEW: Update JSON content when data changes if view is open
  useEffect(() => {
    if (showLLMView) {
      const placeholder = settings?.variablePlaceholder || "{#var#}";
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const placeholderRegex = new RegExp(escapeRegExp(placeholder), 'g');

      const instances = Object.keys(variableValues).map((key, index) => {
        const vars = variableValues[key].data;

        // Create variable objects if metadata is enabled, otherwise strings
        let variablesData = vars;
        if (settings?.showMetadataInJson !== false) {
          variablesData = vars.map(v => ({
            value: v,
            length: v.length
          }));
        }

        const instanceObj = {
          name: `Instance ${index + 1}`,
          variables: variablesData
        };

        if (settings?.showMetadataInJson !== false) {
          // Calculate message length
          let varIndex = 0;
          const message = input.replace(placeholderRegex, () => vars[varIndex++] || "");

          instanceObj.currentMessageLength = message.length;
        }

        return instanceObj;
      });

      const currentData = {
        title: title,
        template: input,
        instances: instances,
      };

      if (settings?.showTemplateIdInJson !== false) {
        currentData.templateId = templateId;
      }

      if (settings?.showNotesInJson !== false) {
        currentData.notes = notes;
      }

      if (settings?.showMetadataInJson !== false) {
        currentData.currentTemplateLength = input.length;

        currentData.targetMaxMessageLength = settings?.templateCharLimit
          ? parseInt(settings.templateCharLimit)
          : "No Limit";

        currentData.targetMaxVariableLength = settings?.variableCharLimit
          ? parseInt(settings.variableCharLimit)
          : "No Limit";
      }

      setJsonContent(JSON.stringify(currentData, null, 2));
    }
  }, [showLLMView, input, variableCount, variableValues, templateId, notes, settings, title]);

  const handleApplyLLMData = () => {
    try {
      const parsedData = JSON.parse(jsonContent);
      const updates = {};

      if (parsedData.title !== undefined) {
        updates.title = parsedData.title;
      }

      // Map 'template' -> 'input'
      if (parsedData.template !== undefined) updates.input = parsedData.template;
      // Fallback for old 'input' property
      else if (parsedData.input !== undefined) updates.input = parsedData.input;

      // Map 'instances' -> 'variableValues'
      if (parsedData.instances && Array.isArray(parsedData.instances)) {
        const newVariableValues = {};
        let maxVarCount = 0;

        parsedData.instances.forEach((inst, index) => {
          const id = `T${dataId}I${index}`;

          let varData = inst.variables || inst.data || [];
          // Handle object-based variables (extract value)
          if (Array.isArray(varData) && varData.length > 0 && typeof varData[0] === 'object' && varData[0] !== null) {
            varData = varData.map(v => v.value !== undefined ? v.value : "");
          }

          newVariableValues[id] = {
            id: id,
            data: varData
          };
          if (newVariableValues[id].data.length > maxVarCount) {
            maxVarCount = newVariableValues[id].data.length;
          }
        });
        updates.variableValues = newVariableValues;
        updates.instanceCounter = parsedData.instances.length; // Reset counter to next available
        updates.variableCount = maxVarCount; // Update variable count based on max found
      }
      // Fallback for old 'variableValues' object
      else if (parsedData.variableValues !== undefined) {
        updates.variableValues = parsedData.variableValues;
        // Recalculate variable count if needed, or trust input?
        // Let's trust input if provided, or calc.
      }

      if (parsedData.templateId !== undefined) updates.templateId = parsedData.templateId;
      if (parsedData.notes !== undefined) updates.notes = parsedData.notes;

      // If variableCount is explicitly provided in old format, use it, otherwise we calculated it above
      if (parsedData.variableCount !== undefined && !updates.variableCount) {
        updates.variableCount = parsedData.variableCount;
      }

      updateState(updates);

      addNotification("Data applied successfully!", 'medium');
    } catch (e) {
      alert("Invalid JSON: " + e.message);
    }
  };

  // Global click listener for deselection
  useEffect(() => {
    const handleGlobalClick = () => {
      setSelectedInstanceId(null);
    };

    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // NEW: Auto-scroll to bottom when a new instance is added
  useEffect(() => {
    const currentInstanceCount = Object.keys(variableValues).length;

    // Check if an instance was added
    if (currentInstanceCount > prevInstanceCount.current) {
      // Scroll to bottom
      setTimeout(() => {
        if (window.innerWidth <= 900) {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        } else if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTo({
            top: scrollContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }

    prevInstanceCount.current = currentInstanceCount;
  }, [variableValues]);

  // NEW: Auto-scroll to selected instance
  useEffect(() => {
    if (selectedInstanceId) {
      const element = document.getElementById(selectedInstanceId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // If navigation was triggered by shortcut, ALWAYS focus the instance
        if (wasShortcutNavigation.current) {
          element.focus({ preventScroll: true });
          wasShortcutNavigation.current = false;
        }
        // Otherwise (click/tab), only focus if focus is NOT already inside it
        else if (!element.contains(document.activeElement)) {
          element.focus({ preventScroll: true });
        }
      }
    }
  }, [selectedInstanceId]);

  // NEW: Custom Resize Logic
  const isResizing = useRef(false);
  const lastDownY = useRef(0);
  const lastHeight = useRef(0);

  // NEW: Track if selection change was due to shortcut
  const wasShortcutNavigation = useRef(false);

  const handleMouseDown = (e) => {
    isResizing.current = true;
    lastDownY.current = e.clientY;
    if (textareaRef.current) {
      lastHeight.current = textareaRef.current.offsetHeight;
    }
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault(); // Prevent text selection during drag
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current || !textareaRef.current) return;
    const deltaY = e.clientY - lastDownY.current;
    const newHeight = Math.max(150, lastHeight.current + deltaY); // Min height 150px
    textareaRef.current.style.height = `${newHeight}px`;
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // NEW: Mobile Result View Dismiss Logic
  const touchStartRef = useRef(null);
  const isDraggingRef = useRef(false);

  const handleResultTouchStart = (e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    isDraggingRef.current = false;
  };

  const handleResultTouchMove = (e) => {
    if (!touchStartRef.current) return;
    const moveX = Math.abs(e.touches[0].clientX - touchStartRef.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);

    // If moved more than 10px, consider it a drag/scroll
    if (moveX > 10 || moveY > 10) {
      isDraggingRef.current = true;
    }
  };

  const handleResultTouchEnd = (e) => {
    // Only dismiss if it wasn't a drag and we are on mobile
    if (!isDraggingRef.current && window.innerWidth <= 900) {
      // Check if text was selected (don't close if selecting text)
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        setShowResult(false);
      }
    }
    touchStartRef.current = null;
    isDraggingRef.current = false;
  };

  // Keyboard Shortcuts for Page Actions
  useEffect(() => {
    const handlePageShortcuts = (e) => {
      if (e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'arrowup':
            e.preventDefault();
            // If we are in the textarea, Alt+Up should do nothing (stay there)
            if (document.activeElement === textareaRef.current) {
              break;
            }

            if (Object.keys(variableValues).length > 0) {
              const instanceIds = Object.keys(variableValues);
              const currentIndex = selectedInstanceId ? instanceIds.indexOf(selectedInstanceId) : -1;
              wasShortcutNavigation.current = true;

              if (currentIndex === 0) {
                // If first instance is selected, move focus to template
                setSelectedInstanceId(null);
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              } else if (currentIndex > 0) {
                setSelectedInstanceId(instanceIds[currentIndex - 1]);
              } else if (currentIndex === -1) {
                // If none selected AND not in textarea, select the last one
                // (If we were in textarea, we would have hit the check above)
                setSelectedInstanceId(instanceIds[instanceIds.length - 1]);
              }
            }
            break;
          case 'arrowdown':
            e.preventDefault();
            if (Object.keys(variableValues).length > 0) {
              const instanceIds = Object.keys(variableValues);
              const currentIndex = selectedInstanceId ? instanceIds.indexOf(selectedInstanceId) : -1;
              wasShortcutNavigation.current = true;
              if (currentIndex < instanceIds.length - 1 && currentIndex !== -1) {
                setSelectedInstanceId(instanceIds[currentIndex + 1]);
              } else if (currentIndex === -1) {
                setSelectedInstanceId(instanceIds[0]);
              }
            }
            break;
          case 'x':
            e.preventDefault();
            if (selectedInstanceId) {
              deleteInstance(selectedInstanceId);
            }
            break;
          case 'q':
            e.preventDefault();
            setShowResult(prev => !prev);
            if (!showResult) setShowLLMView(false); // If opening result, close LLM view (logic from toggle button)
            break;
          case 'j':
            e.preventDefault();
            if (showLLMView) {
              setShowLLMView(false);
            } else {
              handleOpenLLMView();
            }
            break;
          case 'c':
            e.preventDefault();
            handleInsertVariable();
            break;
          case 'g':
            e.preventDefault();
            copyToClipboard(input);
            triggerFlash('template');
            break;
          case 'b':
            e.preventDefault();
            const text = resultText.join("\n\n");
            copyToClipboard(text);
            triggerFlash('result');
            break;
          case 'home':
            e.preventDefault();
            // Close views if open
            if (showResult) setShowResult(false);
            if (showLLMView) setShowLLMView(false);

            if (textareaRef.current) {
              textareaRef.current.focus();
              textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            break;
          case 'enter':
            e.preventDefault();
            if (titleInputRef.current) {
              titleInputRef.current.focus();
            }
            break;
          case 'end':
            e.preventDefault();
            if (Object.keys(variableValues).length > 0) {
              const instanceIds = Object.keys(variableValues);
              wasShortcutNavigation.current = true;
              setSelectedInstanceId(instanceIds[instanceIds.length - 1]);
            }
            break;
          case 'n':
            e.preventDefault();
            createNewInstance(true); // Force empty
            break;
          case 'd':
            if (e.shiftKey) {
              e.preventDefault();
              if (selectedInstanceId) {
                createNewInstance(false); // Copy selected
              }
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handlePageShortcuts);
    return () => window.removeEventListener('keydown', handlePageShortcuts);
  }, [variableValues, selectedInstanceId, showResult, showLLMView, input, resultText]);

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div id="Page">
      <div className="left-column">
        <label
          id="title"
          className={`copy ${flashingComponent === 'title' ? 'flash-active' : ''}`}
          onClick={(e) => {
            copyToClipboard(title);
            triggerFlash('title');
          }}
        >
          Title:
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
          />
        </label>
        <div className="meta-fields">
          <label
            className={`copy ${flashingComponent === 'templateId' ? 'flash-active' : ''}`}
            onClick={(e) => {
              copyToClipboard(templateId);
              triggerFlash('templateId');
            }}
          >
            Template ID:
            <input
              type="text"
              value={templateId}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateState({ templateId: e.target.value })}
              placeholder="Registration ID"
            />
          </label>
          <label
            className={`copy notes-label ${flashingComponent === 'notes' ? 'flash-active' : ''}`}
            onClick={(e) => {
              copyToClipboard(notes);
              triggerFlash('notes');
            }}
          >
            Notes:
            <textarea
              value={notes}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => updateState({ notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </label>
        </div>
      </div>

      <div className="right-column">
        <div className="right-header">
          <button
            className="toggle-result-btn"
            onClick={() => {
              if (showLLMView) {
                setShowLLMView(false);
              } else {
                handleOpenLLMView();
              }
            }}
          >
            {showLLMView ? <><VscJson /> Hide JSON View</> : <><VscJson /> JSON View</>}
          </button>
          <button
            className="toggle-result-btn"
            onClick={() => {
              if (!showResult) {
                setShowLLMView(false);
              }
              setShowResult(!showResult);
            }}
          >
            {showResult ? <><MdVisibilityOff /> Hide Result</> : <><MdVisibility /> Show Result</>}
          </button>
          <button
            className={`copyBtn ${flashingComponent === 'result' ? 'flash-active' : ''}`}
            onClick={(e) => {
              const text = resultText.join("\n\n");
              copyToClipboard(text);
              triggerFlash('result');
            }}
          >
            <MdContentCopy /> Copy Result
          </button>
          <button
            className={`copyBtn ${flashingComponent === 'template' ? 'flash-active' : ''}`}
            onClick={(e) => {
              copyToClipboard(input);
              triggerFlash('template');
            }}
          >
            <MdContentCopy /> Copy Template
          </button>
          <button
            className={`addBtn ${selectedInstanceId ? 'warn' : ''} ${flashingComponent === 'addBtn' ? 'flash-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              createNewInstance();
              if (selectedInstanceId) triggerFlash('addBtn');
            }}
          >
            <MdAddCircleOutline /> {selectedInstanceId ? 'Copy Instance' : 'Add Instance'}
          </button>
        </div>
        <div className="right-content-wrapper">
          <div
            className={`right-content ${showResult || showLLMView ? "no-scroll" : ""}`}
            ref={scrollContainerRef}
          >
            <div id="input">
              <div className="textarea-wrapper">
                <textarea
                  id="inputElem"
                  ref={textareaRef}
                  onChange={handleSMSinput}
                  onSelect={handleSelectionUpdate}
                  onClick={handleSelectionUpdate}
                  onKeyUp={handleSelectionUpdate}
                  value={input}
                  placeholder={`Paste SMS here with variables as ${settings?.variablePlaceholder || "{#var#}"}`}
                ></textarea>
                <div className="resize-handle" onMouseDown={handleMouseDown}>
                  <PiCornersOut />
                </div>
              </div>
              <div className="textareaExtras">
                <span>
                  {(() => {
                    const placeholder = settings?.variablePlaceholder || "{#var#}";
                    const placeholderLen = placeholder.length;
                    const staticLength = input.length - (variableCount * placeholderLen);
                    const minChars = staticLength;
                    const hasTemplateLimit = !!settings?.templateCharLimit;
                    const hasVariableLimit = !!settings?.variableCharLimit;
                    const templateLimit = hasTemplateLimit ? parseInt(settings.templateCharLimit) : 0;
                    const variableLimit = hasVariableLimit ? parseInt(settings.variableCharLimit) : 0;

                    if (!hasTemplateLimit && !hasVariableLimit) {
                      return `Min: ${minChars} chars`;
                    }

                    const stats = [];

                    // Min Chars
                    const minHighRisk = hasTemplateLimit && minChars > templateLimit;
                    stats.push(
                      <span key="min" className={minHighRisk ? "text-risk-high" : ""}>
                        {`Min: ${minChars} chars`}
                      </span>
                    );

                    // Max Chars
                    if (hasVariableLimit) {
                      const maxChars = minChars + (variableCount * variableLimit);
                      const maxHighRisk = hasTemplateLimit && maxChars > templateLimit;
                      stats.push(
                        <span key="max" className={maxHighRisk ? "text-risk-high" : ""}>
                          {`Max: ${maxChars} chars`}
                        </span>
                      );
                    }

                    // Avg Var Target
                    if (hasTemplateLimit && variableCount > 0) {
                      let avgVarTarget = (templateLimit - minChars) / variableCount;
                      if (hasVariableLimit) {
                        avgVarTarget = Math.min(avgVarTarget, variableLimit);
                      }
                      stats.push(
                        <span key="avg">
                          {`Avg Var Target: ${Math.floor(avgVarTarget)} chars`}
                        </span>
                      );
                    }

                    return stats.reduce((prev, curr, index) => {
                      return index === 0 ? [curr] : [...prev, " | ", curr];
                    }, []);
                  })()}
                </span>
                <button onClick={handleInsertVariable}>Insert Variable</button>
              </div>
            </div>
            <div id="instances">
              <div
                id="board"
              >
                {Object.keys(variableValues).map((instance, i) => (
                  <Instance
                    data={variableValues[instance].data}
                    name={variableValues[instance].id}
                    index={i}
                    // key={variableValues[instance].id}
                    key={`${dataId}${instance} `}
                    onVarChange={(vars) => onVarChange(instance, vars)}
                    copyFunc={copyToClipboard}
                    deleteInstance={() => deleteInstance(instance)}
                    previewText={replacePlaceholders(
                      input,
                      variableValues[instance].data,
                    )}
                    isSelected={selectedInstanceId === instance}
                    onSelect={() => setSelectedInstanceId(instance)}
                    copiedState={copiedVariables[instance]}
                    onClearCopied={(varIndex) => handleClearCopied(instance, varIndex)}
                    variableCharLimit={settings?.variableCharLimit}
                    templateCharLimit={settings?.templateCharLimit}
                  />
                ))}
              </div>
            </div>

            {/* Inline Result View */}
            <div id="inline-result">
              <div className="inline-result-content">
                {resultText.map((text, index) => (
                  <p key={index}>
                    {text.split("\n").map((line, i) => (
                      <React.Fragment key={i}>
                        {line} <br />
                      </React.Fragment>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div
            id="result-wrapper"
            className={showResult ? 'visible' : ''}
            onTouchStart={handleResultTouchStart}
            onTouchMove={handleResultTouchMove}
            onTouchEnd={handleResultTouchEnd}
            onClick={() => {
              // Also handle click for non-touch interaction if needed, 
              // but user specifically asked for mobile tap.
              // We can rely on touch events for mobile.
              // But if we want to support click on background for desktop?
              // User didn't ask for that.
            }}
          >
            <div id="result">
              {resultText.map((text, index) => {
                return (
                  <p key={index}>
                    {text.split("\n").map((text, i) => (
                      <React.Fragment key={i}>
                        {text} <br />
                      </React.Fragment>
                    ))}
                  </p>
                );
              })}
            </div>
          </div>

          <div id="llm-wrapper" className={showLLMView ? 'visible' : ''}>
            <div id="llm-view">
              <div className="llm-controls">
                <button onClick={handleApplyLLMData}>Apply Data</button>
                <button
                  className={flashingComponent === 'json' ? 'flash-active' : ''}
                  onClick={(e) => {
                    copyToClipboard(jsonContent);
                    triggerFlash('json');
                  }}>Copy JSON</button>
                <button
                  className="close-json-btn"
                  onClick={() => setShowLLMView(false)}
                  title="Close JSON View"
                >
                  <MdClose />
                </button>
              </div>
              <textarea
                value={jsonContent}
                onChange={(e) => setJsonContent(e.target.value)}
                placeholder="Paste JSON data here..."
              />
              {settings?.showMetadataInJson !== false && (
                <p className="json-view-hint">
                  Note: Character counts and limits are for reference only and will be ignored when applying data.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="footer">
        Created by <a href="https://github.com/Necryl/Preview-SMS-with-variables" target="_blank" rel="noopener noreferrer">Necryl</a> with the assistance of AI using Google AntiGravity
      </div>
      {/* Notification Container */}
      <NotificationContainer notifications={notifications} />
    </div >
  );
}

Page.propTypes = {
  dataId: PropTypes.number,
  setTitle: PropTypes.func,
  title: PropTypes.string,
  settings: PropTypes.object,
  data: PropTypes.object,
  onUpdate: PropTypes.func,
};

export default Page;
