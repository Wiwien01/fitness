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

  // --- BEJELENTKEZÉS ÉS REGISZTRÁCIÓ KEZELÉSE ---
  const tabLoginBtn = document.getElementById('tabLoginBtn');
  const tabRegisterBtn = document.getElementById('tabRegisterBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tabLoginBtn && tabRegisterBtn && loginForm && registerForm) {
    // Fülváltás logic
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

    // 1. Regisztráció
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;

      // Elmentett felhasználók betöltése
      const users = JSON.parse(localStorage.getItem('users')) || [];

      // Ellenőrzés: létezik-e már az e-mail cím
      const userExists = users.some(u => u.email === email);
      if (userExists) {
        alert('Ezzel az e-mail címmel már regisztráltak!');
        return;
      }

      // Új felhasználó mentése
      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // Aktív munkamenet elmentése
      localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email }));

      alert('Sikeres regisztráció!');
      window.location.href = 'index.html';
    });

    // 2. Bejelentkezés
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      const users = JSON.parse(localStorage.getItem('users')) || [];

      // Felhasználó keresése
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        alert('Helytelen e-mail cím vagy jelszó!');
        return;
      }

      // Bejelentkezett felhasználó elmentése
      localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));

      window.location.href = 'index.html';
    });
  }

  // --- AKTUÁLIS FELHASZNÁLÓ KEZELÉSE AZ INDEX.HTML OLDALON ---
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // Ha nem a login.html oldalon vagyunk és nincs bejelentkezve felhasználó:
  if (!currentUser && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }

  // Felhasználó nevének megjelenítése (ha van megfelelő elem az oldalon, pl. .user-name)
  const userNameDisplay = document.querySelector('.user-name');
  if (userNameDisplay && currentUser) {
    userNameDisplay.textContent = currentUser.name;
  }

  // Kijelentkezés gomb kezelése (ha van pl. #logoutBtn az oldalon)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  }
});