import { useState, useRef, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Instance from "./Instance.jsx";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [variableCount, setVariableCount] = useState(0);
  const [instanceCount, setInstanceCount] = useState(1);
  const [variableValues, setVariableValues] = useState({});
  const instanceCounter = useRef(0);

  function handleSMSinput(e) {
    setInput(e.target.value);
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const matches = (input.match(/{#var#}/g) || []).length;
      setVariableCount(matches);
      console.log(Object.keys(variableValues).length);
      if (Object.keys(variableValues).length === 0 && variableCount > 0) {
        console.log("CReating new instance");
        const newInstance = generateInstance(variableCount);
        const result = {};
        result[newInstance.id] = newInstance;
        setVariableValues(result);
      }
    }, 300); // Adjust delay as needed (300ms here)

    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [input]);

  function generateInstance(varCount, data = []) {
    const id = "Instance" + instanceCounter;
    instanceCounter.current++;
    return {
      id: id,
      data: data.concat(Array(Math.max(varCount - data.length, 0)).fill("")),
    };
  }

  function handleVariableChange(value, instanceID, varIndex) {
    const result = JSON.parse(JSON.stringify(variableValues));
    result[instanceID].data[varIndex] = value;
    setVariableValues(result);
  }

  return (
    <>
      <div id="input">
        <textarea
          id="inputElem"
          onChange={handleSMSinput}
          value={input}
        ></textarea>
      </div>
      <div id="instances">
        <div id="instanceMenu">
          <button>Add</button>
        </div>
        <div id="board">
          {Object.keys(variableValues).map((instance) => (
            <Instance
              data={variableValues[instance].data}
              index={variableValues[instance].id}
              key={variableValues[instance].id}
            />
          ))}
        </div>
      </div>
      <div id="result">
        <p>
          {(() => {
            function replacePlaceholders(text, values) {
              let index = 0; // To keep track of the array index

              // Replace each "{#var#}" with the next value in the array, if available
              return text.replace(/{#var#}/g, () => values[index++] || "");
            }
            let result = "";
            Object.keys(variableValues).forEach((instance) => {
              let text = replacePlaceholders(
                input,
                variableValues[instance].data
              );
              result += text + "\n\n";
            });
            return result;
          })()}
        </p>
      </div>
    </>
  );
}

export default App;
