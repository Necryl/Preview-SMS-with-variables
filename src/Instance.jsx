import { useState, useEffect } from "react";

function Instance({ data, index, onVarChange, deleteInstance }) {
  const [vars, setVars] = useState([...data]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {}, 300); // Adjust delay as needed (300ms here)
    onVarChange(vars);
    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [vars]);

  return (
    <div className="instance">
      <h3>{"Instance " + (index + 1)}</h3>
      <button
        onClick={() => {
          deleteInstance();
        }}
      >
        X
      </button>
      <div className="vars">
        {vars.map((value, i) => {
          return (
            <div className="var" key={"var" + i}>
              <h3>{"Variable " + (i + 1) + ":"}</h3>
              <input
                type="text"
                value={value}
                index={i}
                onChange={(e) => {
                  let result = [...vars];
                  result[e.target.getAttribute("index")] = e.target.value;
                  setVars(result);
                }}
              />
              <span className="charCount">
                {value.length} {value.length < 2 ? "char" : "chars"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Instance;
