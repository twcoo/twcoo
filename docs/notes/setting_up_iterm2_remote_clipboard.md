# Setting Up iTerm2 Remote Clipboard (SSH + tmux + Neovim)

When you copy in Neovim on the remote server, the text goes through SSH, your local tmux, and your terminal app before it reaches your local clipboard. Each of these has to allow it.

## 1. Allow clipboard access in your terminal app

In iTerm2, go to `Settings > General > Selection` and allow applications in the terminal to access the clipboard. Restart the terminal app.

## 2. Configure tmux on your local machine

### Open the tmux config file

```bash
vi ~/.tmux.conf
```

Add:

```bash
# Let apps inside tmux set the clipboard
set -g set-clipboard on
# Pass clipboard codes through to the terminal (needs tmux 3.3+)
set -g allow-passthrough on
set -as terminal-features ',xterm*:clipboard'
# Enable mouse
set -g mouse on
```

### Restart tmux fully

A reload is not enough. A running tmux server keeps its old settings.

```bash
tmux kill-server
```

Start your session again.

### Check the values

```bash
tmux show -g set-clipboard      # should be: on
tmux show -g allow-passthrough  # should be: on
```

## 3. Configure Neovim on the remote server

LazyVim turns off the system clipboard in SSH sessions. Turn it back on (needs Neovim 0.10+).

### Open the options file

```bash
vi ~/.config/nvim/lua/config/options.lua
```

Add:

```lua
vim.opt.clipboard = "unnamedplus"

vim.g.clipboard = {
  name = "OSC 52",
  copy = {
    ["+"] = require("vim.ui.clipboard.osc52").copy("+"),
    ["*"] = require("vim.ui.clipboard.osc52").copy("*"),
  },
  paste = {
    ["+"] = function() return { vim.fn.split(vim.fn.getreg(""), "\n"), vim.fn.getregtype("") } end,
    ["*"] = function() return { vim.fn.split(vim.fn.getreg(""), "\n"), vim.fn.getregtype("") } end,
  },
}
```

Close Neovim fully and open it again.
