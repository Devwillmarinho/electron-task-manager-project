document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const signupBtn = document.getElementById('signupBtn');
  const errorMessage = document.getElementById('errorMessage');
  const navigateToLogin = document.getElementById('navigateToLogin');

  function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    // Esconde a notificação após 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }

  signupBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    errorMessage.textContent = '';

    if (!email || !password) {
      errorMessage.textContent = 'Por favor, preencha e-mail e senha.';
      return;
    }

    signupBtn.disabled = true;
    signupBtn.textContent = 'Criando...';

    const { error } = await window.api.signUp({ email, password });

    if (error) {
      errorMessage.textContent = 'Erro: ' + error.message;
      signupBtn.disabled = false;
      signupBtn.textContent = 'Criar Conta';
    } else {
      // O usuário agora é logado automaticamente após o cadastro.
      // Enviamos o mesmo sinal do login para ir direto para a tela de projetos.
      window.api.send('login-success');
    }
  });

  navigateToLogin.addEventListener('click', (event) => {
    event.preventDefault(); 
    window.api.send('navigate-to-login');
  });
});