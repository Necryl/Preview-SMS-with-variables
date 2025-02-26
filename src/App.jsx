import Page from "./Page";
import "./App.css";
import styled from "styled-components";
import { useState } from "react";

const Nav = styled.div`
  display: flex;
  flex-wrap: wrap;
  min-height: 2em;
  width: 100%;
  gap: 0.2em;
  border-bottom: 3px solid #353c47;
  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    max-width: 10em;
    min-width: max-content;
    padding: 0em 0.3em;
    --bRad: 0.5em;
    border-radius: var(--bRad) var(--bRad) 0em 0em;
  }
  .addTabBtn {
    display: flex;
    align-items: center; /* Vertically centers the + */
    justify-content: center; /* Horizontally centers the + */
    height: 1.3em; /* Slightly smaller than the 2em Nav height */
    margin-bottom: 0.1em; /* Aligns the + with the bottom of the Nav */
    width: 1.5em; /* Keeps it square */
    align-self: center; /* Centers the button itself in the Nav */
    padding: 0; /* No padding to keep it tight */
    font-size: 1.2em; /* Adjusts the + size */
    font-weight: bold; /* Makes the + more visible
    line-height: 1; /* Ensures the + isn’t offset by line height */
    background-color: #353c47; /* Light grey background */
  }
`;

function App() {
  const [tabCount, setTabCount] = useState(1);
  return (
    <div id="App">
      <Nav>
        {[...Array(tabCount)].map((_, i) => (
          <button className="tab" key={i}>
            Page {i + 1}
          </button>
        ))}
        <button
          className="addTabBtn"
          onClick={() => {
            setTabCount((prev) => prev + 1);
          }}
        >
          +
        </button>
      </Nav>
      <Page />
    </div>
  );
}

export default App;
