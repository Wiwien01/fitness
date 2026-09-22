document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  // ==========================================
  // 1. MUNKAMENET ÉS AUTHENTIKÁCIÓ KEZELÉSE
  // ==========================================
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const isLoginPage = window.location.pathname.includes('login.html');

  if (!currentUser && !isLoginPage) {
    window.location.href = 'login.html';
    return;
  }

  if (currentUser) {
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser.name);

    const nameParts = currentUser.name.trim().split(' ');
    let initials = nameParts.length >= 2 
      ? nameParts[0][0] + nameParts[nameParts.length - 1][0] 
      : (nameParts[0][0] || '');
    
    document.querySelectorAll('.avatar').forEach(el => el.textContent = initials.toUpperCase());
  }

  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('currentUser');
      window.location.href = 'login.html';
    });
  });

  // ==========================================
  // 2. BEJELENTKEZÉS ÉS REGISZTRÁCIÓ FORMOK
  // ==========================================
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

  // ==========================================
  // 3. KALÓRIA & MAKRÓ NYOMONKÖVETÉS
  // ==========================================
  const foodList = document.getElementById('foodList');
  const openFoodModalBtn = document.getElementById('openFoodModalBtn');
  const closeFoodModalBtn = document.getElementById('closeFoodModalBtn');
  const foodModal = document.getElementById('foodModal');
  const addFoodForm = document.getElementById('addFoodForm');
  const editTargetBtn = document.getElementById('editTargetBtn');

  if (foodList && currentUser) {
    const foodStorageKey = `calories_${currentUser.email}`;
    const targetStorageKey = `calorieTarget_${currentUser.email}`;

    // Kalória limit lekérése (alapértelmezett: 2100)
    const getTarget = () => Number(localStorage.getItem(targetStorageKey)) || 2100;
    const getFoods = () => JSON.parse(localStorage.getItem(foodStorageKey)) || [];

    // Felület kirajzolása
    const renderFoods = () => {
      const foods = getFoods();
      const dailyTarget = getTarget();
      foodList.innerHTML = '';

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      if (foods.length === 0) {
        foodList.innerHTML = `<p style="color: var(--muted); text-align: center; padding: 20px;">Még nem rögzítettél ételt a mai napon.</p>`;
      } else {
        foods.forEach((item, index) => {
          totalCalories += Number(item.calories);
          totalProtein += Number(item.protein || 0);
          totalCarbs += Number(item.carbs || 0);
          totalFat += Number(item.fat || 0);

          const defaultImg = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=200&auto=format&fit=crop';
          const imgUrl = item.image && item.image.trim() !== '' ? item.image : defaultImg;

          const itemEl = document.createElement('div');
          itemEl.className = 'group-item';
          itemEl.innerHTML = `
            <div class="food-card">
              <img src="${imgUrl}" alt="${item.name}" class="food-img" onerror="this.src='${defaultImg}'">
              <div class="group-meta">
                <h3>${item.category} - ${item.name}</h3>
                <p>${item.calories} kcal ${item.protein ? `| P: ${item.protein}g C: ${item.carbs}g F:${item.fat}g` : ''}</p>
              </div>
            </div>
            <button class="btn-join delete-food-btn" data-index="${index}" style="color: #ef4444; border-color: rgba(239, 68, 68, 0.2);">
              Törlés
            </button>
          `;
          foodList.appendChild(itemEl);
        });
      }

      // Összesítő frissítése
      const remaining = dailyTarget - totalCalories;
      document.getElementById('calorieTarget').textContent = `Napi kalóriakeret: ${dailyTarget.toLocaleString()} kcal`;
      document.getElementById('calorieStats').textContent = `Eddig bevíve: ${totalCalories.toLocaleString()} kcal | Megmaradt: ${remaining.toLocaleString()} kcal`;

      // Makrók frissítése
      document.getElementById('totalProtein').textContent = `${totalProtein} g`;
      document.getElementById('totalCarbs').textContent = `${totalCarbs} g`;
      document.getElementById('totalFat').textContent = `${totalFat} g`;

      // Törlés gombok
      document.querySelectorAll('.delete-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = e.currentTarget.getAttribute('data-index');
          deleteFood(index);
        });
      });
    };

    // Kalória Limit Módosítása
    if (editTargetBtn) {
      editTargetBtn.addEventListener('click', () => {
        const currentTarget = getTarget();
        const newTarget = prompt('Add meg az új napi kalóriakeretet (kcal):', currentTarget);
        if (newTarget && !isNaN(newTarget) && Number(newTarget) > 0) {
          localStorage.setItem(targetStorageKey, newTarget);
          renderFoods();
        }
      });
    }

    const deleteFood = (index) => {
      const foods = getFoods();
      foods.splice(index, 1);
      localStorage.setItem(foodStorageKey, JSON.stringify(foods));
      renderFoods();
    };

    if (openFoodModalBtn && closeFoodModalBtn && foodModal) {
      openFoodModalBtn.addEventListener('click', () => foodModal.classList.add('open'));
      closeFoodModalBtn.addEventListener('click', () => foodModal.classList.remove('open'));
    }

    if (addFoodForm) {
      addFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const category = document.getElementById('food-category').value;
        const name = document.getElementById('food-name').value.trim();
        const calories = document.getElementById('food-calories').value;
        const image = document.getElementById('food-image').value.trim();
        const protein = document.getElementById('food-protein').value || 0;
        const carbs = document.getElementById('food-carbs').value || 0;
        const fat = document.getElementById('food-fat').value || 0;

        const foods = getFoods();
        foods.push({ category, name, calories, image, protein, carbs, fat });

        localStorage.setItem(foodStorageKey, JSON.stringify(foods));

        addFoodForm.reset();
        foodModal.classList.remove('open');

        renderFoods();
      });
    }

    renderFoods();
  }

  // CSOPORT MODÁL (INDEX.HTML)
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const groupModal = document.getElementById('groupModal');

  if (openModalBtn && closeModalBtn && groupModal) {
    openModalBtn.addEventListener('click', () => groupModal.classList.add('open'));
    closeModalBtn.addEventListener('click', () => groupModal.classList.remove('open'));
  }
});