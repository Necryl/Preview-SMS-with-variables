# Preview SMS with Variables

[Live Demo](https://necryl.github.io/Preview-SMS-with-variables/)

**Preview SMS with Variables** is a specialized tool designed for crafting and testing SMS templates that contain dynamic content. It bridges the gap between a static text template and the final personalized messages sent to users.

## ✨ Key Features

- **Multi-Tab Interface**: Work on multiple different SMS campaigns or templates simultaneously. Tabs can be pinned for safety.
- **Real-Time Preview**: As variables are filled, a "Result" view shows exactly how the final message will look for each instance.
- **Smart Migration**: Changing the variable placeholder string (e.g., from `{#var#}` to `{{name}}`) intelligently migrates existing data to the new format without data loss.
- **LLM Integration**: A dedicated "LLM View" generates a JSON representation of the current state, optimized for pasting into tools like ChatGPT or Claude.
- **Data Safety**: All work is persisted locally in the browser.
- **Mobile Experience**: Responsive design with touch-friendly gestures.

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/Necryl/Preview-SMS-with-variables.git
   cd Preview-SMS-with-variables
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Run the development server**
   ```bash
   pnpm dev
   ```

## ⌨️ Keyboard Shortcuts

Designed for power users, the application can be controlled almost entirely via keyboard.

| Action | Shortcut |
|--------|----------|
| **Add Instance** | `Alt + N` |
| **Duplicate Instance** | `Alt + Shift + D` |
| **Delete Instance** | `Alt + X` |
| **Navigate Tabs** | `Alt + Shift + ←/→` |
| **Toggle Result View** | `Alt + Q` |
| **Toggle JSON View** | `Alt + J` |
| **Copy Template** | `Alt + G` |
| **Copy Result** | `Alt + B` |
| **Insert Variable** | `Alt + C` |
| **Undo / Redo** | `Ctrl + Z` / `Ctrl + Y` |

## 🛠️ Tech Stack

- **Framework**: React (Vite)
- **Styling**: Plain CSS with CSS Variables for theming (Tokyo Night palette).
- **Persistence**: LocalStorage-based state management with custom history hooks.

---

Created by [Necryl](https://github.com/Necryl)

This readme was generated with ai, because I couldn't be bothered to write it myself. It is accurate though, but it could be missing some details.