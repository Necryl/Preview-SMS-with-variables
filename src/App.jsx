import Page from "./Page";
import "./App.css";
import styled from "styled-components";
import { useState } from "react";
import { useEffect } from "react";

const Nav = styled.div`
  display: flex;
  flex-wrap: wrap;
  min-height: 2em;
  width: 100%;
  gap: 0.2em;
  border-bottom: 3px solid #353c47;
  .tab {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    flex: 1;
    max-width: 10em;
    min-width: max-content;
    padding: 0em 0.3em;
    --bRad: 0.5em;
    border-radius: var(--bRad) var(--bRad) 0em 0em;
  }
  .tab span {
    position: absolute;
    right: 0.5em;
    margin-left: 0.5em;
    font-size: 0.8em;
    aspect-ratio: 1;
    height: 1em;
    width: 1em;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.6em;
    align-self: center;
    margin: 0em;
    opacity: 0;
    background-color: #353c47;
  }
  .tab:hover span {
    opacity: 1;
  }
  .tab span:hover {
    background-color: #ff4d4d;
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
  const loadedTabs = loadTabs();
  const [tabs, setTabs] = useState(loadedTabs ? loadedTabs.list : {});
  const [currentTab, setCurrentTab] = useState(
    loadedTabs ? loadedTabs.current : 0,
  );

  function loadTabs() {
    const savedTabs = {
      list: JSON.parse(localStorage.getItem("tabs")),
      current: JSON.parse(localStorage.getItem("currentTab")),
    };

    if (savedTabs.list && savedTabs.current) {
      return savedTabs;
    }
  }

  function saveTabs() {
    localStorage.setItem("tabs", JSON.stringify(tabs));
    localStorage.setItem("currentTab", JSON.stringify(currentTab));
  }
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveTabs();
    }, 100); // Adjust delay as needed (300ms here)

    return () => clearTimeout(timeoutId); // Clear timeout if input changes within delay
  }, [tabs, currentTab]);

  function createTab() {
    const result = structuredClone(tabs);
    const keys = Object.keys(tabs);
    const id = Number(keys.length) > 0 ? Number(keys[keys.length - 1]) + 1 : 1;
    result[id] = { title: `SMS ${id}` };
    setTabs(result);
    setCurrentTab(id);
  }
  if (Object.keys(tabs).length === 0) {
    createTab();
  }
  function removeTab(id) {
    setTabs((prev) => {
      const result = structuredClone(prev);
      if (Number(currentTab) === Number(id) && Object.keys(result).length > 1) {
        const keys = Object.keys(result);
        let nextTab = null;
        if (keys.indexOf(id.toString()) == keys.length - 1) {
          nextTab = keys[keys.length - 2];
        } else {
          nextTab = keys[keys.indexOf(id.toString()) + 1];
        }
        setCurrentTab(Number(nextTab));
      }
      delete result[id];
      localStorage.removeItem(id);

      return result;
    });
  }
  function setTitle(id, title) {
    const result = structuredClone(tabs);
    result[id].title = title;
    setTabs(result);
  }
  return (
    <div id="App">
      <button
        id="reset"
        onClick={() => {
          localStorage.clear();
          location.reload();
        }}
      >
        Reset
      </button>
      <Nav>
        {Object.keys(tabs).map((key, i) => (
          <button className="tab" onClick={() => setCurrentTab(key)} key={i}>
            {tabs[key].title}{" "}
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeTab(key);
              }}
            >
              x
            </span>
          </button>
        ))}
        <button
          className="addTabBtn"
          onClick={() => {
            createTab();
          }}
        >
          +
        </button>
      </Nav>
      <Page
        dataId={Number(currentTab)}
        setTitle={(title) => {
          setTitle(currentTab, title);
        }}
        title={tabs[currentTab] ? tabs[currentTab].title : "loading..."}
      />
    </div>
  );
}

export default App;
