import { useState, useEffect } from "react";
import PropTypes from "prop-types";

function Instance({ data, index, onVarChange, deleteInstance, copyFunc }) {
  const [vars, setVars] = useState([...data]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {}, 300); // Adjust delay as needed (300ms here)
    onVarChange(vars);
    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [vars, onVarChange]);

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
              <label
                onClick={() => {
                  copyFunc(value);
                }}
              >
                {"Variable " + (i + 1) + ":"}
                <input
                  type="text"
                  value={value}
                  data-index={i}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onChange={(e) => {
                    let result = [...vars];
                    result[e.target.getAttribute("data-index")] =
                      e.target.value;
                    setVars(result);
                  }}
                />
                <span className="charCount">
                  {value.length} {value.length < 2 ? "char" : "chars"}
                </span>
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Instance.propTypes = {
  data: PropTypes.array,
  index: PropTypes.number,
  onVarChange: PropTypes.func,
  deleteInstance: PropTypes.func,
  copyFunc: PropTypes.func,
};

export default Instance;
