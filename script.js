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

    const getTarget = () => Number(localStorage.getItem(targetStorageKey)) || 2100;
    const getFoods = () => JSON.parse(localStorage.getItem(foodStorageKey)) || [];

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

      const remaining = dailyTarget - totalCalories;
      document.getElementById('calorieTarget').textContent = `Napi kalóriakeret: ${dailyTarget.toLocaleString()} kcal`;
      document.getElementById('calorieStats').textContent = `Eddig bevíve: ${totalCalories.toLocaleString()} kcal | Megmaradt: ${remaining.toLocaleString()} kcal`;

      document.getElementById('totalProtein').textContent = `${totalProtein} g`;
      document.getElementById('totalCarbs').textContent = `${totalCarbs} g`;
      document.getElementById('totalFat').textContent = `${totalFat} g`;

      document.querySelectorAll('.delete-food-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = e.currentTarget.getAttribute('data-index');
          deleteFood(index);
        });
      });
    };

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

  // ==========================================
  // 4. CSOPORT MODÁL (INDEX.HTML)
  // ==========================================
  const openModalBtn = document.getElementById('openModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const groupModal = document.getElementById('groupModal');

  if (openModalBtn && closeModalBtn && groupModal) {
    openModalBtn.addEventListener('click', () => groupModal.classList.add('open'));
    closeModalBtn.addEventListener('click', () => groupModal.classList.remove('open'));
  }

  // ==========================================
  // 5. EDZÉSTERVEK ÉS RÉSZLETES NÉZET KEZELÉSE
  // ==========================================
  const defaultWorkoutPlans = {
    '1': {
      title: 'Push - Pull - Leg',
      subtitle: 'Toló - Húzó - Láb felosztás',
      image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1200&auto=format&fit=crop',
      description: 'A Push-Pull-Legs az egyik leghatékonyabb edzésosztás. Lehetővé teszi az egyes izomcsoportok célzott és intenzív megdolgoztatását, miközben elegendő pihenőidőt biztosít a regenerációhoz.',
      schedule: [
        { day: 'Hétfő', name: 'Push (Mell, Váll, Tricepsz)', details: ['Fekvenyomás rúddal: 4x8-10', 'Incline kézi súlyzós nyomás: 3x10', 'Mellről nyomás: 3x10', 'Tricepsz letolás csigán: 4x12'] },
        { day: 'Kedd', name: 'Pull (Hát, Bicepsz, Hátsó váll)', details: ['Mellhez húzás / Húzódzkodás: 4x8', 'Döntött törzsű evezés: 4x10', 'Facepull (Arcrashúzás): 3x15', 'Bicepsz franciarúddal: 3x12'] },
        { day: 'Szerda', name: 'Legs (Láb, Has)', details: ['Guggolás rúddal: 4x8', 'Román felhúzás (RDL): 4x10', 'Lábtolás gépben: 3x12', 'Vádli állva + Hasprés: 4x15'] },
        { day: 'Csütörtök', name: 'Pihenőnap', details: ['Könnyű séta, mobilizáció és nyújtás'] },
        { day: 'Péntek', name: 'Push (Váll fókusz)', details: ['Kézi súlyzós nyomás: 4x10', 'Oldalemelés: 4x12-15', 'Tolódzkodás: 3x8-10'] },
        { day: 'Szombat', name: 'Pull (Hát fókusz)', details: ['T-rúdos evezés: 4x10', 'Egykezes evezés kézi súlyzóval: 3x12', 'Kalapács bicepsz: 3x12'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Teljes pihenés és regenerálódás'] }
      ]
    },
    '2': {
      title: 'Bro Split',
      subtitle: 'Klasszikus testépítő felosztás',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
      description: 'Egyes napokon kifejezetten egy-egy izomcsoportra fókuszál. Ideális a maximális izom pumpáltság eléréséhez és a nagy volumenű terheléshez.',
      schedule: [
        { day: 'Hétfő', name: 'Mell nap', details: ['Fekvenyomás rúddal: 4x8', 'Ferde pados nyomás: 4x10', 'Tárogatás csigán: 3x12'] },
        { day: 'Kedd', name: 'Hát nap', details: ['Felhúzás: 4x6', 'Lehúzás széles fogással: 4x10', 'Evezés gépben: 3x12'] },
        { day: 'Szerda', name: 'Váll nap', details: ['Mellről nyomás: 4x8', 'Oldalemelés: 4x12', 'Döntött törzsű oldalemelés: 3x15'] },
        { day: 'Csütörtök', name: 'Kar nap', details: ['Bicepsz rúddal: 4x10', 'Koponyaürítő: 4x10', 'Tricepsz letolás: 3x12'] },
        { day: 'Péntek', name: 'Láb nap', details: ['Guggolás: 4x8', 'Lábhajítás gépben: 4x12', 'Lábnyújtás gépben: 3x12', 'Vádli: 4x15'] },
        { day: 'Szombat', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    },
    '3': {
      title: 'Upper - Lower',
      subtitle: 'Alsó - Felsőtest felosztás',
      image: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1200&auto=format&fit=crop',
      description: 'Heti 4 napos edzésterv, ami kiváló egyensúlyt teremt a terhelés és a pihenés között. Hetente kétszer ingerli a főbb izomcsoportokat.',
      schedule: [
        { day: 'Hétfő', name: 'Felsőtest A', details: ['Fekvenyomás: 4x8', 'Evezés rúddal: 4x8', 'Vállból nyomás: 3x10'] },
        { day: 'Kedd', name: 'Alsótest A', details: ['Guggolás: 4x8', 'Román felhúzás: 4x10', 'Vádli állva: 4x12'] },
        { day: 'Szerda', name: 'Pihenőnap', details: ['Séta, könnyű aktivitás'] },
        { day: 'Csütörtök', name: 'Felsőtest B', details: ['Ferde pados nyomás: 4x10', 'Húzódzkodás: 4x Max', 'Oldalemelés: 3x15'] },
        { day: 'Péntek', name: 'Alsótest B', details: ['Lábtolás: 4x12', 'Kitörések: 3x10/láb', 'Hasprés: 3x20'] },
        { day: 'Szombat', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    },
    '4': {
      title: 'Alsó - Felsőtest csak rehab',
      subtitle: 'Teljes rehabilitációs edzésterv',
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop',
      description: 'Kímélő, mobilizációra és ízületi stabilitásra épülő edzésterv sérülések utáni visszatéréshez, regenerációhoz vagy gyógytornához.',
      schedule: [
        { day: 'Hétfő', name: 'Felső mobilitás', details: ['Rotátorköpeny gyakorlatok', 'Plank tartások', 'Gumiszalagos húzások'] },
        { day: 'Kedd', name: 'Alsó mobilitás', details: ['Glute bridge', 'Kagyló gyakorlat', 'Boka mobilizáció'] },
        { day: 'Szerda', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Csütörtök', name: 'Felső regeneráció', details: ['SMR hengerezés', 'Nyújtás', 'Könnyű gumiszalagos edzés'] },
        { day: 'Péntek', name: 'Alsó regeneráció', details: ['Saját testsúlyos fellépések', 'Egylábas egyensúlyozás'] },
        { day: 'Szombat', name: 'Séta & Nyújtás', details: ['30 perc könnyű séta'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    },
    '5': {
      title: 'Full Body',
      subtitle: 'Teljes test edzés',
      image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop',
      description: 'Minden edzésen az egész testet megmozgatja. Kezdőknek vagy időhiánnyal küzdőknek (heti 3 edzés) ideális választás.',
      schedule: [
        { day: 'Hétfő', name: 'Full Body A', details: ['Guggolás: 3x8', 'Fekvenyomás: 3x8', 'Döntött törzsű evezés: 3x8'] },
        { day: 'Kedd', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Szerda', name: 'Full Body B', details: ['Felhúzás: 3x5', 'Mellről nyomás: 3x8', 'Húzódzkodás: 3x8'] },
        { day: 'Csütörtök', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Péntek', name: 'Full Body C', details: ['Kitörések: 3x10', 'Ferde pados nyomás: 3x10', 'Kézi súlyzós evezés: 3x10'] },
        { day: 'Szombat', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    },
    '6': {
      title: 'Mixed Workout',
      subtitle: 'Kevert funkcionális edzés',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=1200&auto=format&fit=crop',
      description: 'Összetett gyakorlatok és funkcionális elemek ötvözete a jó állóképesség, erő és robbanékonyság fejlesztéséhez.',
      schedule: [
        { day: 'Hétfő', name: 'Push/Pull kevert', details: ['Fekvenyomás + Evezés: 4x10', 'Kardió intervallum: 15 perc'] },
        { day: 'Kedd', name: 'Láb & Has', details: ['Lábtolás: 4x12', 'Kettlebell swing: 4x15', 'Core edzés: 3 kör'] },
        { day: 'Szerda', name: 'Pihenőnap', details: ['Könnyű aktivitás'] },
        { day: 'Csütörtök', name: 'Kar & Váll kevert', details: ['Vállból nyomás + Bicepsz: 4x10', 'Oldalemelés: 4x12'] },
        { day: 'Péntek', name: 'Funkcionális nap', details: ['Súlyszán tolás', 'Kötélugrás', 'Kettlebell nyomás'] },
        { day: 'Szombat', name: 'Kardió / Séta', details: ['45 perc zóna 2 kardió'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    },
    '7': {
      title: 'Rehab - Edzés',
      subtitle: 'Hibrid rehabilitáció és erőnlét',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop',
      description: 'Normál erősítő edzések kiegészítve prevenciós és rehabilitációs elemekkel az ízületek és szalagok védelme érdekében.',
      schedule: [
        { day: 'Hétfő', name: 'Váll rehab + Felső', details: ['Rotátorköpeny bemelegítés', 'Kézi súlyzós nyomás: 3x10', 'Facepull: 4x15'] },
        { day: 'Kedd', name: 'Térd rehab + Alsó', details: ['Csípő aktiváció', 'Könnyű guggolás: 3x10', 'Combtő erősítés: 3x12'] },
        { day: 'Szerda', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Csütörtök', name: 'Hát & Törzs', details: ['Plank variációk', 'Madár-kutya gyakorlat', 'Húzódzkodás gumipánttal'] },
        { day: 'Péntek', name: 'Kardió & Nyújtás', details: ['Evezőpad / Kerékpár: 20 perc', 'Teljes test nyújtás'] },
        { day: 'Szombat', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ]
    }
  };

  // Dinamikus edzéstervek lekezelése (alapértelmezett + felhasználó által mentettek)
  const getCustomPlans = () => JSON.parse(localStorage.getItem('customWorkoutPlans')) || {};
  const getAllWorkoutPlans = () => ({ ...defaultWorkoutPlans, ...getCustomPlans() });

  // ÚJ TERV LÉTREHOZÁSA (WORKOUT.HTML)
  const openNewPlanModalBtn = document.getElementById('openNewPlanModalBtn');
  const closeNewPlanModalBtn = document.getElementById('closeNewPlanModalBtn');
  const newPlanModal = document.getElementById('newPlanModal');
  const createPlanForm = document.getElementById('createPlanForm');
  const workoutCardsContainer = document.getElementById('workoutCardsContainer');

  if (openNewPlanModalBtn && closeNewPlanModalBtn && newPlanModal) {
    openNewPlanModalBtn.addEventListener('click', () => newPlanModal.classList.add('open'));
    closeNewPlanModalBtn.addEventListener('click', () => newPlanModal.classList.remove('open'));
  }

  const renderCustomWorkoutCards = () => {
    if (!workoutCardsContainer) return;

    const customPlans = getCustomPlans();
    Object.keys(customPlans).forEach(id => {
      // Elkerüljük a duplikációt, ha már kirajzoltuk
      if (document.getElementById(`custom-plan-card-${id}`)) return;

      const plan = customPlans[id];
      const cardEl = document.createElement('div');
      cardEl.className = 'workout-card';
      cardEl.id = `custom-plan-card-${id}`;

      const defaultImg = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop';
      const imgSrc = plan.image && plan.image.trim() !== '' ? plan.image : defaultImg;

      cardEl.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${imgSrc}" class="card-image" alt="${plan.title}" onerror="this.src='${defaultImg}'">
        </div>
        <div class="card-content">
          <h3 class="card-title">${plan.title}</h3>
          <p class="card-subtitle">${plan.subtitle}</p>
          <a href="workout-detail.html?id=${id}" class="btn-primary card-btn">
            Edzésterv indítása <i data-lucide="chevron-right"></i>
          </a>
        </div>
      `;
      workoutCardsContainer.appendChild(cardEl);
    });

    if (window.lucide) {
      lucide.createIcons();
    }
  };

  if (createPlanForm) {
    createPlanForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('plan-title').value.trim();
      const subtitle = document.getElementById('plan-subtitle').value.trim();
      const description = document.getElementById('plan-desc').value.trim();
      const image = document.getElementById('plan-image').value.trim();

      const planId = 'custom_' + Date.now();

      const newPlan = {
        title,
        subtitle,
        description,
        image: image || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
        schedule: [
          { day: 'Hétfő', name: 'Egyéni edzés nap A', details: ['Gyakorlatok hozzáadása folyamatban'] },
          { day: 'Kedd', name: 'Pihenőnap', details: ['Pihenés'] },
          { day: 'Szerda', name: 'Egyéni edzés nap B', details: ['Gyakorlatok hozzáadása folyamatban'] },
          { day: 'Csütörtök', name: 'Pihenőnap', details: ['Pihenés'] },
          { day: 'Péntek', name: 'Egyéni edzés nap C', details: ['Gyakorlatok hozzáadása folyamatban'] },
          { day: 'Szombat', name: 'Pihenőnap', details: ['Pihenés'] },
          { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
        ]
      };

      const customPlans = getCustomPlans();
      customPlans[planId] = newPlan;
      localStorage.setItem('customWorkoutPlans', JSON.stringify(customPlans));

      createPlanForm.reset();
      newPlanModal.classList.remove('open');

      renderCustomWorkoutCards();
    });
  }

  // Meglévő egyedi tervek betöltése
  renderCustomWorkoutCards();

  // RÉSZLETES NÉZET KEZELÉSE (WORKOUT-DETAIL.HTML)
  const detailContainer = document.getElementById('workoutDetailContent');
  if (detailContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id') || '1';
    
    const allPlans = getAllWorkoutPlans();
    const plan = allPlans[planId] || allPlans['1'];

    // Naptárszerű kártyák generálása
    let calendarCardsHTML = (plan.schedule || []).map(item => {
      const isRest = item.name.toLowerCase().includes('pihenő') || item.name.toLowerCase().includes('séta');
      return `
        <div style="
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid ${isRest ? 'rgba(255, 255, 255, 0.08)' : 'var(--primary, #3b82f6)'};
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          opacity: ${isRest ? '0.75' : '1'};
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 8px;">
            <span style="font-weight: 700; font-size: 1.1rem; color: #fff;">${item.day}</span>
            <span style="
              font-size: 0.75rem; 
              padding: 2px 8px; 
              border-radius: 20px; 
              background: ${isRest ? 'rgba(255,255,255,0.1)' : 'rgba(59, 130, 246, 0.2)'};
              color: ${isRest ? '#9ca3af' : '#60a5fa'};
              font-weight: 600;
            ">${isRest ? 'Pihenő' : 'Edzés'}</span>
          </div>

          <div style="font-size: 0.95rem; font-weight: 600; color: ${isRest ? '#9ca3af' : '#fff'}; margin-bottom: 4px;">
            ${item.name}
          </div>

          <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.85rem; color: #d1d5db; display: flex; flex-direction: column; gap: 6px;">
            ${(item.details || []).map(d => `
              <li style="display: flex; align-items: flex-start; gap: 6px;">
                <span style="color: var(--primary, #3b82f6); font-weight: bold;">•</span>
                <span>${d}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }).join('');

    detailContainer.innerHTML = `
      <img src="${plan.image}" class="workout-banner" alt="${plan.title}">
      <div class="hero-box">
        <h2>${plan.title}</h2>
        <p style="color: var(--primary, #3b82f6); font-weight: 500; margin-bottom: 8px;">${plan.subtitle}</p>
        <p>${plan.description}</p>
        <button class="btn-primary" style="width: 100%; margin-top: 12px;">
          <i data-lucide="play-circle"></i> Terv Indítása & Követése
        </button>
      </div>

      <section style="margin-top: 32px;">
        <div class="section-header" style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px;">Heti Beosztás </div>
        <div style="
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        ">
          ${calendarCardsHTML}
        </div>
      </section>
    `;

    if (window.lucide) {
      lucide.createIcons();
    }
  }
});