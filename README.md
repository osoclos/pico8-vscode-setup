# pico8-vscode-setup

A simple template repository to setup a Windows development environment for [PICO-8](https://www.lexaloffle.com/pico-8.php) in [Visual Studio Code](https://code.visualstudio.com/).

## Prerequisites

You will need to install the following runtime, extension and font (optional but recommended):

- [Node.js Runtime](https://nodejs.org/)

- [Extension by Pollywog Games](https://marketplace.visualstudio.com/items?itemName=PollywogGames.pico8-ls)
- [Font by Simbax](https://fontstruct.com/fontstructions/show/2052852/pico-8-27)

## Setup

Before you begin running, you will need to setup environment variables in `"env"` located in `.vscode/launch.json`, specifically `PICO8_EXE_PATH`, which is an absolute path to your PICO-8 executable. You may also wish to change the cartridge entry file (`ENTRY_CART_PATH`) and your Lua entry file (`ENTRY_FILE_PATH`), as well as any [arguments](https://pico-8.fandom.com/wiki/RunningPico8) that you may want to pass to PICO-8 via `PICO8_ARGS`.

### Keybinds

If you wish to enter special symbols provided by PICO-8 when typing capital letters, you can copy the keybindings listed in `.vscode/keybindings.json` and paste them into your own user's `keybindings.json` file (This can be accessed by opening up the command palette (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) and typing `Preferences: Open Keyboard Shortcuts (JSON)` into the prompt box).

> [!NOTE]
>
> In order to view the special symbols properly, you will need to install the font provided above. Otherwise, it may appear incorrectly and may be confused with other characters.

## Usage

Simply press <kbd>F5</kbd> (or whatever key you have bind to your `workbench.action.debug.start` (Debug: Start Debugging) command) and it will open up PICO-8 with your project cartridge!

The cartridge assets (art, music, etc.) can be modified from the PICO-8 engine itself once it has been generated.
