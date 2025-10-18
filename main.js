const { app, BrowserWindow, Menu, globalShortcut, dialog, ipcMain } = require("electron")
const path = require("path")

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    backgroundColor: "#0f0f0f",
    titleBarStyle: "default",
    icon: path.join(__dirname, "assets", "icon.png"),
  })

  mainWindow.loadFile("index.html")


  Menu.setApplicationMenu(null)

  mainWindow.on("closed", () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  // Registra o atalho para focar no input.
  // com layouts de teclado ABNT/ABNT2, onde 'Ctrl+M' é interpretado como 'Ctrl+N'.
  const focusShortcut = () => {
    if (mainWindow) {
      mainWindow.webContents.send("focus-input")
    }
  }
  globalShortcut.register("CommandOrControl+Shift+N", focusShortcut)
  globalShortcut.register("CommandOrControl+Shift+M", focusShortcut) // Alternativa para ABNT2

  globalShortcut.register("CommandOrControl+Shift+1", () => {
    if (mainWindow) mainWindow.webContents.send("filter-tasks", "all")
  })

  globalShortcut.register("CommandOrControl+Shift+2", () => {
    if (mainWindow) mainWindow.webContents.send("filter-tasks", "pending")
  })

  globalShortcut.register("CommandOrControl+Shift+3", () => {
    if (mainWindow) mainWindow.webContents.send("filter-tasks", "completed")
  })

  // Atalho para abrir/fechar ferramentas de desenvolvedor
  globalShortcut.register("CommandOrControl+Shift+I", () => {
    if (mainWindow) mainWindow.webContents.toggleDevTools()
  })

  // Atalho para recarregar a janela
  globalShortcut.register("CommandOrControl+Shift+R", () => {
    if (mainWindow) mainWindow.reload()
  })


  ipcMain.on("show-shortcuts", () => {
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Atalhos de Teclado",
      message: "Atalhos Disponíveis",
      detail:
        "Ctrl+Shift+N - Nova Tarefa\nCtrl+Shift+Q - Sair do Aplicativo\n\nCtrl+Shift+1 - Filtrar: Todas as Tarefas\nCtrl+Shift+2 - Filtrar: Tarefas Pendentes\nCtrl+Shift+3 - Filtrar: Tarefas Concluídas\n\nEnter - Adicionar Tarefa (no campo de texto)\n\nCtrl+Shift+R - Recarregar a Janela\nCtrl+Shift+I - Ferramentas de Desenvolvedor",
      buttons: ["Entendi"],
    })
  })

  globalShortcut.register("CommandOrControl+Shift+Q", () => {
    app.quit()
  })

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("will-quit", () => {
  globalShortcut.unregisterAll()
})
