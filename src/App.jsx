import { useState, useRef, useEffect } from "react";
import Instance from "./Instance.jsx";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [variableCount, setVariableCount] = useState(0);
  const [variableValues, setVariableValues] = useState({});
  const instanceCounter = useRef(0);

  if (Object.keys(variableValues).length === 0 && variableCount > 0) {
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

  return (
    <div id="App">
      <div id="input">
        <textarea
          id="inputElem"
          onChange={handleSMSinput}
          value={input}
          placeholder="Paste SMS here with variables as {#var#}"
        ></textarea>
      </div>
      <div id="instances">
        <div id="instanceMenu">
          <button
            onClick={() => {
              createNewInstance();
            }}
          >
            Add
          </button>
        </div>
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
              deleteInstance={() => {
                deleteInstance(variableValues[instance].id);
              }}
            />
          ))}
        </div>
      </div>
      <div id="result">
        {(() => {
          function replacePlaceholders(text, values) {
            let index = 0; // To keep track of the array index

            // Replace each "{#var#}" with the next value in the array, if available
            return text.replace(/{#var#}/g, () => values[index++] || "");
          }
          return Object.keys(variableValues).map((instance) => {
            let text = replacePlaceholders(
              input,
              variableValues[instance].data
            );
            return (
              <p>
                {text.split("\n").map((text) => (
                  <>
                    {text} <br />
                  </>
                ))}
              </p>
            );
          });
        })()}
      </div>
    </div>
  );
}

export default App;
