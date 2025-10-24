class TaskManager {
  constructor() {    
    this.currentFilter = "all"
    this.projects = []
    this.userId = null

    this.init()
  }

  init() {
    this.taskInput = document.getElementById("taskInput")
    this.prioritySelect = document.getElementById("prioritySelect")
    this.addTaskBtn = document.getElementById("addProjectBtn")
    this.logoutBtn = document.getElementById('logoutBtn');
    this.taskList = document.getElementById("taskList");
    this.emptyState = document.getElementById("emptyState")

    this.addTaskBtn.addEventListener("click", () => this.addTask())
    this.taskInput.addEventListener("keypress", (e) => {

      if (e.key === "Enter") this.addTask()
    })

    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.setFilter(e.currentTarget.dataset.filter)
      })
    })

    this.logoutBtn.addEventListener('click', () => {
      this.logout();
    })

    window.api.on("focus-input", () => {
      this.taskInput.focus()
    })

    window.api.on("filter-tasks", (event, filter) => {
      this.setFilter(filter)
    })

    this.loadInitialData()
  }

  showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type} show`;

    setTimeout(() => {
      notification.classList.remove('show');
    }, 4000);
  }

  async loadInitialData() {
    try {
      const user = await window.api.getUser()
      if (user) {
        this.userId = user.id
        await this.loadProjects()
      }
      else {
        console.warn('Nenhum usuário logado encontrado.');
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
    }
  }

  async logout() {
    try {
      await window.api.signOut();
      window.api.send('logout'); // CORREÇÃO: Usar a API exposta pelo preload
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }

  async addTask() {
    const text = this.taskInput.value.trim()
    if (!text) return

    // O ID é gerado pelo Supabase, não precisamos mais do Date.now()
    const project = {
      user_id: this.userId,
      title: text, 
      completed: false,
      priority: this.prioritySelect.value,
    }

    try {
      const { error } = await window.api.createProject(project);
      if (error) throw error;

      await this.loadProjects(); // Recarrega os projetos após adicionar
      this.taskInput.value = "";
      this.taskInput.focus();
      this.showNotification('Projeto adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      this.showNotification('Não foi possível adicionar o projeto.', 'error');
    }
  }

  async toggleTask(id) {
    const project = this.projects.find((p) => p.id === id)
    if (project) {
      const newStatus = !project.completed;
      try {
        const { error } = await window.api.updateProject(id, { completed: newStatus });
        if (error) throw error;
        // Atualiza o estado localmente para uma resposta visual imediata
        project.completed = newStatus;
        this.render();
      } catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        this.showNotification('Não foi possível atualizar o projeto.', 'error');
      }
    }
  }

  async deleteTask(id) {
    // Usamos a notificação para confirmar a exclusão, o que é menos intrusivo.
    // Para uma solução ideal, um modal de confirmação seria o próximo passo.
    if (!window.confirm('Tem certeza que deseja excluir este projeto?')) return;

    try {
      const { error } = await window.api.deleteProject(id);
      if (error) throw error;
      await this.loadProjects(); // Recarrega a lista do banco
      this.showNotification('Projeto excluído.', 'success');
    } catch (error) {
      console.error('Erro ao deletar projeto:', error);
      this.showNotification('Não foi possível excluir o projeto.', 'error');
    }
  }

  setFilter(filter) {
    this.currentFilter = filter
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.filter === filter)
    })
    // Apenas renderiza novamente com o novo filtro, não precisa recarregar do banco.
    this.render()
  }

  getFilteredTasks() {
    switch (this.currentFilter) {

      case "pending":
        return this.projects.filter((t) => !t.completed)
      case "completed":
        return this.projects.filter((t) => t.completed)
      default:
        return this.projects
    }
  }

  async loadProjects() {
    try {
      const { data, error } = await window.api.getProjects();
      if (error) throw error;
      // Ordena os projetos mais recentes primeiro
      this.projects = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      this.render(); // Renderiza a tela após carregar os projetos
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
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
            <div class="task-text">${this.escapeHtml(task.title)}</div>
            <div class="task-meta">
              <span class="priority-badge ${task.priority}">${this.getPriorityLabel(task.priority)}</span>
              <span>${this.formatDate(task.created_at)}</span>
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
    const total = this.projects.length
    const pending = this.projects.filter((t) => !t.completed).length
    const completed = total - pending;

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
}

document.addEventListener("DOMContentLoaded", () => {
  new TaskManager()
})
