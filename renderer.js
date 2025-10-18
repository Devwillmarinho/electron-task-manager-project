const { ipcRenderer } = require("electron")

class TaskManager {
  constructor() {
    this.tasks = this.loadTasks()
    this.currentFilter = "all"
    this.init()
  }

  init() {
    this.taskInput = document.getElementById("taskInput")
    this.prioritySelect = document.getElementById("prioritySelect")
    this.addTaskBtn = document.getElementById("addTaskBtn")
    this.taskList = document.getElementById("taskList")
    this.showShortcutsBtn = document.getElementById("showShortcutsBtn")
    this.emptyState = document.getElementById("emptyState")

    this.addTaskBtn.addEventListener("click", () => this.addTask())
    this.taskInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.addTask()
    })

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.target.dataset.filter)
      })
    })

    this.showShortcutsBtn.addEventListener("click", () => {
      ipcRenderer.send("show-shortcuts")
    })

    ipcRenderer.on("focus-input", () => {
      this.taskInput.focus()
    })

    ipcRenderer.on("filter-tasks", (event, filter) => {
      this.setFilter(filter)
    })

    this.render()
  }

  addTask() {
    const text = this.taskInput.value.trim()
    if (!text) return

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      priority: this.prioritySelect.value,
      createdAt: new Date().toISOString(),
    }

    this.tasks.unshift(task)
    this.saveTasks()
    this.taskInput.value = ""
    this.taskInput.focus()
    this.render()
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id)
    if (task) {
      task.completed = !task.completed
      this.saveTasks()
      this.render()
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id)
    this.saveTasks()
    this.render()
  }

  setFilter(filter) {
    this.currentFilter = filter
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter)
    })
    this.render()
  }

  getFilteredTasks() {
    switch (this.currentFilter) {
      case "pending":
        return this.tasks.filter((t) => !t.completed)
      case "completed":
        return this.tasks.filter((t) => t.completed)
      default:
        return this.tasks
    }
  }

  render() {
    const filteredTasks = this.getFilteredTasks()

    this.taskList.innerHTML = ""

    if (filteredTasks.length === 0) {
      this.emptyState.classList.add("show")
    } else {
      this.emptyState.classList.remove("show")

      filteredTasks.forEach((task) => {
        const li = document.createElement("li")
        li.className = `task-item ${task.completed ? "completed" : ""}`

        li.innerHTML = `
          <div class="task-checkbox ${task.completed ? "checked" : ""}" data-id="${task.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="task-content">
            <div class="task-text">${this.escapeHtml(task.text)}</div>
            <div class="task-meta">
              <span class="priority-badge ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
              <span>${this.formatDate(task.createdAt)}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-action delete" data-id="${task.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
              </svg>
            </button>
          </div>
        `

        li.querySelector(".task-checkbox").addEventListener("click", () => {
          this.toggleTask(task.id)
        })

        li.querySelector(".delete").addEventListener("click", () => {
          this.deleteTask(task.id)
        })

        this.taskList.appendChild(li)
      })
    }

    this.updateStats()
  }

  updateStats() {
    const total = this.tasks.length
    const pending = this.tasks.filter((t) => !t.completed).length
    const completed = this.tasks.filter((t) => t.completed).length

    document.getElementById("totalTasks").textContent = total
    document.getElementById("pendingTasks").textContent = pending
    document.getElementById("countAll").textContent = total
    document.getElementById("countPending").textContent = pending
    document.getElementById("countCompleted").textContent = completed
  }

  getPriorityLabel(priority) {
    const labels = {
      high: "Alta",
      medium: "Média",
      low: "Baixa",
    }
    return labels[priority] || priority
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Agora"
    if (minutes < 60) return `${minutes}m atrás`
    if (hours < 24) return `${hours}h atrás`
    if (days < 7) return `${days}d atrás`

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(this.tasks))
  }

  loadTasks() {
    const saved = localStorage.getItem("tasks")
    return saved ? JSON.parse(saved) : []
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new TaskManager()
})
