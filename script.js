document.addEventListener('DOMContentLoaded', () => {
  // Lucide ikonok inicializálása
  if (window.lucide) {
    lucide.createIcons();
  }

  // Modál kezelése az index.html oldalon
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const groupModal = document.getElementById('groupModal');

  if (openModalBtn && closeModalBtn && groupModal) {
    openModalBtn.addEventListener('click', () => {
      groupModal.classList.add('open');
    });

    closeModalBtn.addEventListener('click', () => {
      groupModal.classList.remove('open');
    });
  }

  // Bejelentkezés / Regisztráció fülváltó
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
    tabLoginBtn.addEventListener('click', () => {
      tabLoginBtn.classList.add('active');
      tabRegisterBtn.classList.remove('active');
      loginForm.classList.add('active');
      registerForm.classList.remove('active');
    });

    tabRegisterBtn.addEventListener('click', () => {
      tabRegisterBtn.classList.add('active');
      tabLoginBtn.classList.remove('active');
      registerForm.classList.add('active');
      loginForm.classList.remove('active');
    });

    // Bejelentkezés gomb átirányítás (index.html-re)
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });

    // Regisztráció gomb átirányítás (index.html-re)
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      window.location.href = 'index.html';
    });
  }
});