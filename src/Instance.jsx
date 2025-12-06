import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Tooltip from "./Tooltip.jsx";
import { MdDelete, MdDeleteSweep } from "react-icons/md";

function Instance({ data, index, onVarChange, deleteInstance, copyFunc, previewText, isSelected, onSelect, copiedState, onClearCopied, variableCharLimit, templateCharLimit, name }) {
  const [flashingIndex, setFlashingIndex] = useState(null);

  return (
    <div
      id={name}
      tabIndex={-1}
      className={`instance ${isSelected ? "selected" : ""}`}
      onFocus={(e) => {
        // If focus is within this component (including children), select it
        if (!isSelected) {
          onSelect();
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <Tooltip content={previewText}>
        <h3>{"Instance " + (index + 1)}</h3>
      </Tooltip>
      <div className="instance-controls">
        <button
          className="clear-instance-btn"
          title="Clear all variables"
          onClick={(e) => {
            e.stopPropagation();
            const emptyData = new Array(data.length).fill("");
            onVarChange(emptyData);
            // Clear copied state for all variables if needed
            if (copiedState) {
              Object.keys(copiedState).forEach(key => onClearCopied(key));
            }
          }}
        >
          <MdDeleteSweep /> Clear
        </button>
        <button
          className="delete-instance-btn"
          onClick={(e) => {
            e.stopPropagation();
            deleteInstance();
          }}
        >
          <MdDelete />
        </button>
      </div>
      <div className="vars">
        {data.map((value, i) => {
          const isOverLimit = variableCharLimit && value.length > parseInt(variableCharLimit);
          return (
            <div className="var" key={"var" + i}>
              <label
                className={`copy ${flashingIndex === i ? "flash-active" : ""} ${isOverLimit ? "text-risk-high" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  copyFunc(value);
                  setFlashingIndex(i);
                  setTimeout(() => setFlashingIndex(null), 400);
                }}
              >
                {"Variable " + (i + 1) + ":"}
                <input
                  type="text"
                  value={value}
                  data-index={i}
                  className={`${copiedState && copiedState[i] ? "copied-warning" : ""} ${isOverLimit ? "border-risk-high" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (copiedState && copiedState[i]) {
                      onClearCopied(i);
                    }
                  }}
                  onChange={(e) => {
                    const newData = [...data];
                    newData[i] = e.target.value;
                    onVarChange(newData);
                    if (copiedState && copiedState[i]) {
                      onClearCopied(i);
                    }
                  }}
                />
                <span className={`charCount ${isOverLimit ? "text-risk-high" : ""}`}>
                  {variableCharLimit
                    ? `${value.length} / ${variableCharLimit} chars`
                    : `${value.length} ${value.length < 2 ? "char" : "chars"}`}
                </span>
              </label>
            </div>
          );
        })}
      </div>
      <div className={`instance-stats ${templateCharLimit && previewText && previewText.length > parseInt(templateCharLimit) ? "text-risk-high" : ""}`}>
        Total characters: {previewText ? previewText.length : 0}
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
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func,
  copiedState: PropTypes.object,
  onClearCopied: PropTypes.func,
  variableCharLimit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  templateCharLimit: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default Instance;
