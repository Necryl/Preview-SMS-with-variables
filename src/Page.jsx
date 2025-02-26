import React, { useState, useRef, useEffect } from "react";
import Instance from "./Instance.jsx";
import "./Page.css";
import PropTypes from "prop-types";

function Page({ dataId, setTitle, title }) {
  const dataLoaded = loadData();
  const [input, setInput] = useState(dataLoaded ? dataLoaded.input : "");
  const [variableCount, setVariableCount] = useState(
    dataLoaded ? dataLoaded.variableCount : 0,
  );
  const [variableValues, setVariableValues] = useState(
    dataLoaded ? dataLoaded.variableValues : {},
  );
  const instanceCounter = useRef(dataLoaded ? dataLoaded.instanceCounter : 0);

  function loadData() {
    const data = localStorage.getItem(dataId);
    if (data) {
      const parsedData = JSON.parse(data);
      return parsedData;
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newData = loadData();
      if (newData) {
        setInput(newData.input);
        setVariableCount(newData.variableCount);
        setVariableValues(newData.variableValues);
        instanceCounter.current = newData.instanceCounter;
      }
    }, 300); // Adjust delay as needed (300ms here)

    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [dataId]);

  function saveData() {
    const data = {
      input,
      variableCount,
      variableValues,
      instanceCounter: instanceCounter.current,
    };
    localStorage.setItem(dataId, JSON.stringify(data));
  }
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveData();
    }, 300); // Adjust delay as needed (300ms here)

    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [input, variableCount, variableValues, instanceCounter.current]);

  if (Object.keys(variableValues).length === 0 && variableCount > 0) {
    console.log("creating new instance if statement");
    createNewInstance();
  }
  function deleteInstance(id) {
    let result = { ...variableValues };
    delete result[id];
    setVariableValues(result);
  }

  function handleSMSinput(e) {
    setInput(e.target.value);
  }

  function onVarChange(id, vars) {
    setVariableValues((prevState) => {
      const result = {
        ...prevState,
      };

      result[id].data = vars;

      return result;
    });
  }

  function createNewInstance() {
    const newInstance = generateInstance(variableCount);
    const result = { ...variableValues };
    result[newInstance.id] = newInstance;
    setVariableValues(result);
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const matches = (input.match(/{#var#}/g) || []).length;
      setVariableCount(matches);
    }, 300); // Adjust delay as needed (300ms here)

    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [input]);

  function generateInstance(varCount, data = []) {
    const id = "Instance" + instanceCounter.current;
    instanceCounter.current++;
    return {
      id: id,
      data: data.concat(Array(Math.max(varCount - data.length, 0)).fill("")),
    };
  }

  function copyToClipboard(text) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log("Text copied to clipboard:", text);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  }

  function replacePlaceholders(text, values) {
    let index = 0; // To keep track of the array index

    // Replace each "{#var#}" with the next value in the array, if available
    return text.replace(/{#var#}/g, () => values[index++] || "");
  }
  const resultText = Object.keys(variableValues).map((instance) =>
    replacePlaceholders(input, variableValues[instance].data),
  );

  const textareaRef = useRef(null);

  const handleInsertVariable = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const variable = "{#var#}";

    // If there's a selection, replace it; otherwise insert at cursor
    let newText = "Error: this text should be the new text, update it!";
    if (start !== end) {
      // Replace selected text
      newText = text.substring(0, start) + variable + text.substring(end);
    } else {
      // Insert at cursor position
      newText = text.substring(0, start) + variable + text.substring(start);
      // Move cursor to after the inserted variable
      // textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    }
    setInput(newText);

    // Trigger the onChange event manually if you're using a controlled component
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    // Keep focus on textarea
    textarea.focus();
  };

  return (
    <div id="Page">
      <label id="title" className="copy" onClick={() => copyToClipboard(title)}>
        Title:
        <input
          type="text"
          value={title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setTitle(e.target.value);
          }}
        />
      </label>
      <div id="input">
        <textarea
          id="inputElem"
          ref={textareaRef}
          onChange={handleSMSinput}
          value={input}
          placeholder="Paste SMS here with variables as {#var#}"
        ></textarea>
        <div className="textareaExtras">
          <span>{`${input.length} char${input.length > 0 ? "s" : ""}`}</span>
          <button onClick={handleInsertVariable}>Variable</button>
        </div>
      </div>
      <div id="instances">
        {(() => {
          const menu = (
            <div className="instanceMenu">
              <button
                className="copyBtn"
                onClick={() => {
                  const text = resultText.join("\n\n");
                  copyToClipboard(text);
                }}
              >
                Copy Result
              </button>
              <button
                className="addBtn"
                onClick={() => {
                  createNewInstance();
                }}
              >
                Add
              </button>
            </div>
          );

          return (
            <>
              {menu}

              <div id="board">
                {Object.keys(variableValues).map((instance, i) => (
                  <Instance
                    data={variableValues[instance].data}
                    name={variableValues[instance].id}
                    index={i}
                    key={variableValues[instance].id}
                    onVarChange={(vars) => {
                      onVarChange(variableValues[instance].id, vars);
                    }}
                    copyFunc={copyToClipboard}
                    deleteInstance={() => {
                      deleteInstance(variableValues[instance].id);
                    }}
                  />
                ))}
              </div>
              {menu}
            </>
          );
        })()}
      </div>
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
  );
}

Page.propTypes = {
  dataId: PropTypes.number,
  setTitle: PropTypes.func,
  title: PropTypes.string,
};

export default Page;
