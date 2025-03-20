document.addEventListener("DOMContentLoaded", function() {
  // Lógica da página de Login
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          if (!user.emailVerified) {
            alert("Por favor, confirme seu e-mail antes de entrar.");
            firebase.auth().signOut();
            return;
          }
          if (!email.endsWith("@casasbahia.com.br")) {
            alert("Apenas usuários do domínio casasbahia.com.br podem acessar.");
            firebase.auth().signOut();
            return;
          }
          window.location.href = "index.html";
        })
        .catch((error) => {
          alert("Erro ao fazer login: " + error.message);
        });
    });

    const forgotPasswordLink = document.getElementById("forgot-password");
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", function(e) {
        e.preventDefault();
        const email = document.getElementById("email").value;
        if (!email) {
          alert("Por favor, insira seu e-mail para redefinir a senha.");
          return;
        }
        firebase.auth().sendPasswordResetEmail(email)
          .then(() => {
            alert("E-mail de redefinição enviado.");
          })
          .catch((error) => {
            alert("Erro ao enviar e-mail de redefinição: " + error.message);
          });
      });
    }
  }

  // Lógica da página de Registro
  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", function(e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirm-password").value;
      
      if (password !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
      }
      if (!email.endsWith("@casasbahia.com.br")) {
        alert("Apenas e-mails do domínio casasbahia.com.br são permitidos.");
        return;
      }
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          const user = userCredential.user;
          user.sendEmailVerification().then(() => {
            alert("Registro realizado com sucesso! Um e-mail de verificação foi enviado. Por favor, confirme seu e-mail antes de fazer login.");
            window.location.href = "login.html";
          });
        })
        .catch((error) => {
          alert("Erro ao registrar: " + error.message);
        });
    });
  }
});
