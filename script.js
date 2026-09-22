document.addEventListener('DOMContentLoaded', () => {
  // Lucide ikonok inicializálása
  if (window.lucide) {
    lucide.createIcons();
  }

  // Aktuális bejelentkezett felhasználó lekérése
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isLoginPage = window.location.pathname.includes('login.html');

  // Ha nincs bejelentkezve és nem a login oldalon van, átirányítás a login.html-re
  if (!currentUser && !isLoginPage) {
    window.location.href = 'login.html';
    return;
  }

  // Felhasználói adatok frissítése a felületen (ha be van jelentkezve)
  if (currentUser) {
    // Név frissítése
    const userNameDisplays = document.querySelectorAll('.user-name');
    userNameDisplays.forEach(el => {
      el.textContent = currentUser.name;
    });

    // Monogram kiszámítása a profilképhez (pl. Kovács Tamás -> KT)
    const nameParts = currentUser.name.trim().split(' ');
    let initials = '';
    if (nameParts.length >= 2) {
      initials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
    } else if (nameParts.length === 1 && nameParts[0].length > 0) {
      initials = nameParts[0][0];
    }
    initials = initials.toUpperCase();

    // Profilkép / Avatar frissítése
    const avatarDisplays = document.querySelectorAll('.avatar');
    avatarDisplays.forEach(el => {
      el.textContent = initials;
    });
  }

  // --- KIJELENTKEZÉS KEZELÉSE ---
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  });

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

    // Regisztráció
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;

      const users = JSON.parse(localStorage.getItem('users')) || [];

      if (users.some(u => u.email === email)) {
        alert('Ezzel az e-mail címmel már regisztráltak!');
        return;
      }

      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      localStorage.setItem('currentUser', JSON.stringify({ name: newUser.name, email: newUser.email }));

      alert('Sikeres regisztráció!');
      window.location.href = 'index.html';
    });

    // Bejelentkezés
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;

      const users = JSON.parse(localStorage.getItem('users')) || [];
      const user = users.find(u => u.email === email && u.password === password);

      if (!user) {
        alert('Helytelen e-mail cím vagy jelszó!');
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify({ name: user.name, email: user.email }));

      window.location.href = 'index.html';
    });
  }
});