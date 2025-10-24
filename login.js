document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  const loginBtn = document.getElementById('loginBtn');
  const errorMessage = document.getElementById('errorMessage');
  const navigateToSignup = document.getElementById('navigateToSignup');

  function showNotification(message, type = 'error') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;

    // Esconde a notificação após 5 segundos
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  }

  const handleAuth = async (authAction) => {
    const email = emailInput.value;
    const password = passwordInput.value;
    errorMessage.textContent = '';

    if (!email || !password) {
      errorMessage.textContent = 'Por favor, preencha e-mail e senha.';
      return;
    }

    // Mostra um feedback visual de que algo está acontecendo
    loginBtn.disabled = true;
    loginBtn.textContent = 'Aguarde...';

    const { data, error } = await authAction({ email, password });

    if (error) {
      showNotification('Erro: ' + error.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
    } else {
      // Se for login, avisa o processo principal para mudar de tela
      window.api.send('login-success');
    }
  };

  loginBtn.addEventListener('click', () => handleAuth(window.api.signIn));

  navigateToSignup.addEventListener('click', (event) => {
    event.preventDefault(); // Impede o comportamento padrão do link
    // Avisa o processo principal para carregar a tela de cadastro
    window.api.send('navigate-to-signup');
  });
});