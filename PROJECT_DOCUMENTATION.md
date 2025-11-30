Report Generated on 30 November 2025 14:04
# Project Documentation: Preview SMS with Variables

## 1. User Perspective
*What the user experiences and cares about.*

**Preview SMS with Variables** is a specialized tool designed for crafting and testing SMS templates that contain dynamic content. It bridges the gap between a static text template and the final personalized messages sent to users.

### Core Workflow
- **Template Editing**: Users write a message in a main text area, inserting variables using a customizable placeholder (default `{#var#}`).
- **Instance Management**: Users can create multiple "instances" of this message. Each instance represents a distinct recipient or scenario, allowing the user to fill in specific values for each variable found in the template.
- **Real-Time Preview**: As variables are filled, a "Result" view shows exactly how the final message will look for each instance, concatenating the static text with the dynamic values.

### Key Features
- **Multi-Tab Interface**: Work on multiple different SMS campaigns or templates simultaneously. Tabs can be **pinned** to keep important templates safe and accessible.
- **Keyboard Efficiency**: The application is built for speed.
    - `Alt + N`: Add a new instance.
    - `Alt + Shift + D`: Duplicate the selected instance.
    - `Alt + Shift + Arrow Keys`: Navigate between tabs.
    - `Ctrl + Z / Ctrl + Y`: robust Undo/Redo system.
- **LLM Integration**: A dedicated "LLM View" generates a JSON representation of the current state (template + instances), optimized for pasting into tools like ChatGPT or Claude to generate variations or analyze content.
- **Data Safety**:
    - **Auto-Save**: All work is persisted locally in the browser.
    - **Smart Migration**: Changing the variable placeholder string (e.g., from `{#var#}` to `{{name}}`) intelligently migrates existing data to the new format without data loss.
- **Mobile Experience**: A responsive design that adapts to smaller screens, featuring touch-friendly gestures like swiping to dismiss the result view.

### Customization
- **Settings**: Users can define character limits for the total message or individual variables to ensure SMS compliance (e.g., staying under 160 characters).
- **Visual Feedback**: The interface uses a dark, high-contrast theme with "flash" animations to confirm actions like copying text, ensuring the user always knows the system state.

---

## 2. Developer Perspective
*Code structure, systems, and technical details.*

### Tech Stack
- **Framework**: React (Vite)
- **Styling**: Plain CSS with CSS Modules-like structure (component-specific files) and extensive use of CSS Variables for theming.
- **Persistence**: `localStorage` is the single source of truth for persistence, synced via `App.jsx`.

### Architecture & State Management
- **Lifted State**: The core application state resides in `App.jsx`. This includes:
    - `tabs`: Metadata for open tabs (title, pinned status).
    - `tabData`: The actual content (input text, variable values) for each tab.
    - `currentTab`: The ID of the currently active tab.
- **History System**: A custom `useHistory` hook wraps the initial state loading. It provides `undo`, `redo`, and `set` functions. This means **every** significant state change (typing, adding instances, switching tabs) is pushed to a history stack, enabling global undo/redo capability.
- **Component Hierarchy**:
    - `App`: Manages global state, tabs, and settings.
    - `Page`: The main editor. It receives `data` for the current tab and handles the complex logic of parsing text to find variables.
    - `Instance`: Renders a single row of variable inputs.
    - `Settings`: A modal for global configuration.

### Key Systems
- **Variable Synchronization (`Page.jsx`)**:
    - The `processTextChange` function is the heart of the editor. It compares the *previous* text with the *new* text to detect if variables were added, removed, or moved.
    - It uses a "diffing" strategy (calculating common prefix/suffix) to identify the "volatile zone" where changes occurred, preserving the values of variables that weren't touched.
- **Migration Logic (`utils.js`)**:
    - `migrateVariables` handles the edge case of changing the placeholder string. It regex-matches both old and new placeholders and attempts to map existing values to their new positions based on index order.
- **Reactivity**:
    - The JSON view (`showLLMView`) is reactive. It uses a `useEffect` hook to regenerate the JSON string whenever the underlying data (`input`, `variableValues`, etc.) changes.

### Quirks & Details
- **CSS Variables**: The theme is defined in `index.css` (e.g., `--primary`, `--bg-dark`). Changing these values globally reskins the app.
- **Mobile Scroll**: `Page.jsx` implements custom touch event handling (`handleResultTouchStart`, etc.) to allow swiping away the result modal on mobile without blocking internal scrolling.
- **Selection State**: While data is global, UI state like `selectedInstanceId` is local to `Page.jsx`. This means switching tabs might reset your selection within that page.

---

## 3. Integral Identity & Integrity
*The "soul" of the project—subtle aspects that define its quality.*

### The "Power User" Ethos
This project isn't just a form; it's a **productivity tool**. The integrity of the project relies on:
- **Zero Friction**: Operations should be instant. There are no loading spinners for core actions.
- **Keyboard First**: A user should be able to create a template, add 10 variations, and copy the result without touching the mouse. Removing shortcuts or adding "click-only" workflows would violate the project's identity.

### "Anti-Frustration" Engineering
A core unspoken rule of this codebase is **"Don't lose user work."**
- **Migration**: The complex logic to handle placeholder changes exists solely so users don't have to re-type data if they decide to change syntax.
- **Validation**: The app warns about character limits but doesn't *block* them, treating the user as an adult who might want to break rules intentionally.
- **Undo Everything**: The decision to lift state to `App.jsx` and wrap it in `useHistory` ensures that even "meta" actions like accidentally closing a tab or switching contexts can be reversed.

### Aesthetic "Vibe"
The visual identity is **"Modern Terminal"**.
- It uses a dark palette with neon/cyan accents (`#7aa2f7`), reminiscent of modern code editors (like Tokyo Night themes).
- **Flash Effects**: The visual "flash" when copying or performing actions is integral. It provides visceral feedback that replaces the need for standard "Success" alerts, keeping the flow uninterrupted.
- **Glassmorphism**: Subtle use of `backdrop-filter: blur` on overlays and panels gives it a premium, modern feel without being distracting.

### The "LLM Bridge"
A subtle but defining characteristic is its role as a **staging ground for AI**. The JSON export isn't just a debug feature; it's a first-class citizen designed to feed structured data into LLMs. This makes the tool a "pre-processor" for AI workflows, distinguishing it from simple text replacers.
