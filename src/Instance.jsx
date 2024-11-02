import { useState } from "react";

function Instance({ data, index }) {
  const [vars, setVars] = useState([...data]);
  console.log(vars);
  return (
    <div className="instance">
      {vars.map((value, i) => {
        return (
          <div className="var" key={"var" + i}>
            <h3>{"Variable " + i + ":"}</h3>
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
          </div>
        );
      })}
    </div>
  );
}

export default Instance;
