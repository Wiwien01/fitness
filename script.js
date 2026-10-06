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
  // 3. KALÓRIA, MAKRÓ, RECEPT ÉS VÍZ NYOMONKÖVETÉS
  // ==========================================
  const foodList = document.getElementById('foodList');
  const openFoodModalBtn = document.getElementById('openFoodModalBtn');
  const closeFoodModalBtn = document.getElementById('closeFoodModalBtn');
  const foodModal = document.getElementById('foodModal');
  const addFoodForm = document.getElementById('addFoodForm');
  const editTargetBtn = document.getElementById('editTargetBtn');

  if (foodList && currentUser) {
    const email = currentUser.email;
    const foodStorageKey = `calories_${email}`;
    const targetStorageKey = `calorieTarget_${email}`;
    const recipeStorageKey = `customRecipes_${email}`;
    const waterStorageKey = `water_${email}`;
    const WATER_GOAL = 2500;
    const WATER_STEP = 250;
    const MEALS = ['Reggeli', 'Ebéd', 'Uzsonna', 'Vacsora'];
    const defaultImg = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=200&auto=format&fit=crop';

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pad = (n) => String(n).padStart(2, '0');
    const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const todayISO = () => toISO(new Date());
    const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const fromISO = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };

    let selectedDate = todayISO();
    let recipeFilter = 'Mind';
    let recipeQuery = '';

    // ---------- Adattárolás ----------
    const getTarget = () => Number(localStorage.getItem(targetStorageKey)) || 2100;
    const getAllFoods = () => JSON.parse(localStorage.getItem(foodStorageKey)) || [];
    const saveAllFoods = (arr) => localStorage.setItem(foodStorageKey, JSON.stringify(arr));
    const getCustomRecipes = () => JSON.parse(localStorage.getItem(recipeStorageKey)) || [];
    const saveCustomRecipes = (arr) => localStorage.setItem(recipeStorageKey, JSON.stringify(arr));
    const getWaterData = () => JSON.parse(localStorage.getItem(waterStorageKey)) || {};
    const getWater = () => Number(getWaterData()[selectedDate]) || 0;
    const setWater = (ml) => {
      const data = getWaterData();
      data[selectedDate] = Math.max(0, ml);
      localStorage.setItem(waterStorageKey, JSON.stringify(data));
    };

    // Régi (dátum nélküli) bejegyzések átvétele a mai napra
    (() => {
      const all = getAllFoods();
      let changed = false;
      all.forEach(f => {
        if (!f.date) { f.date = todayISO(); changed = true; }
        if (!f.id) { f.id = newId(); changed = true; }
      });
      if (changed) saveAllFoods(all);
    })();

    const getFoods = () => getAllFoods().filter(f => f.date === selectedDate);

    // ---------- Előre beállított receptek (1 adag) ----------
    const presetRecipes = [
      { id: 'p1', emoji: '🥣', name: 'Zabkása banánnal és mogyoróvajjal', category: 'Reggeli', calories: 420, protein: 16, carbs: 58, fat: 14, time: '10 perc', ingredients: '60 g zabpehely, 2 dl tej, 1 banán, 1 evőkanál mogyoróvaj' },
      { id: 'p2', emoji: '🍳', name: 'Rántotta teljes kiőrlésű pirítóssal', category: 'Reggeli', calories: 380, protein: 24, carbs: 20, fat: 22, time: '10 perc', ingredients: '3 tojás, 1 szelet teljes kiőrlésű kenyér, 1 tk olaj, paradicsom' },
      { id: 'p3', emoji: '🥛', name: 'Görög joghurt gyümölccsel és granolával', category: 'Reggeli', calories: 310, protein: 20, carbs: 38, fat: 8, time: '3 perc', ingredients: '200 g görög joghurt, 80 g bogyós gyümölcs, 25 g granola' },
      { id: 'p4', emoji: '🥞', name: 'Protein palacsinta', category: 'Reggeli', calories: 350, protein: 28, carbs: 40, fat: 8, time: '15 perc', ingredients: '40 g zabliszt, 1 tojás, 1 kanál fehérjepor, 1 dl tej, áfonya' },
      { id: 'p5', emoji: '🍗', name: 'Csirkemell rizzsel és brokkolival', category: 'Ebéd', calories: 520, protein: 48, carbs: 58, fat: 8, time: '25 perc', ingredients: '150 g csirkemell, 70 g száraz rizs, 150 g brokkoli, 1 tk olívaolaj' },
      { id: 'p6', emoji: '🍝', name: 'Tonhalas fullkorn tészta', category: 'Ebéd', calories: 560, protein: 38, carbs: 68, fat: 14, time: '20 perc', ingredients: '80 g fullkorn tészta, 1 doboz tonhal, paradicsomszósz, olívabogyó' },
      { id: 'p7', emoji: '🍲', name: 'Gulyásleves', category: 'Ebéd', calories: 380, protein: 26, carbs: 24, fat: 18, time: '60 perc', ingredients: '120 g marhahús, burgonya, sárgarépa, paprika, hagyma' },
      { id: 'p8', emoji: '🍗', name: 'Sült csirkecomb sült zöldségekkel', category: 'Ebéd', calories: 610, protein: 42, carbs: 34, fat: 32, time: '45 perc', ingredients: '1 csirkecomb, 200 g sütőben sült zöldség, fűszerek' },
      { id: 'p9', emoji: '🥗', name: 'Quinoa saláta csicseriborsóval', category: 'Ebéd', calories: 450, protein: 16, carbs: 62, fat: 15, time: '20 perc', ingredients: '60 g quinoa, 100 g csicseriborsó, uborka, paradicsom, citromlé, olaj' },
      { id: 'p10', emoji: '🫘', name: 'Lencsefőzelék tojással', category: 'Ebéd', calories: 390, protein: 24, carbs: 50, fat: 10, time: '30 perc', ingredients: '80 g lencse, 1 tojás, hagyma, fokhagyma, liszt, ecet' },
      { id: 'p11', emoji: '🧀', name: 'Túró gyümölccsel', category: 'Uzsonna', calories: 220, protein: 24, carbs: 18, fat: 5, time: '2 perc', ingredients: '200 g félzsíros túró, 100 g gyümölcs, fahéj' },
      { id: 'p12', emoji: '🥤', name: 'Protein shake banánnal', category: 'Uzsonna', calories: 250, protein: 30, carbs: 24, fat: 4, time: '2 perc', ingredients: '1 kanál fehérjepor, 1 banán, 2 dl víz vagy mandulatej' },
      { id: 'p13', emoji: '🥜', name: 'Mandula (30 g)', category: 'Uzsonna', calories: 175, protein: 6, carbs: 6, fat: 15, time: '1 perc', ingredients: '30 g natúr mandula' },
      { id: 'p14', emoji: '🍙', name: 'Rizs sütemény avokádóval', category: 'Uzsonna', calories: 230, protein: 5, carbs: 24, fat: 13, time: '5 perc', ingredients: '2 rizs sütemény, fél avokádó, só, citrom' },
      { id: 'p15', emoji: '🐟', name: 'Sült lazac édesburgonyával', category: 'Vacsora', calories: 580, protein: 38, carbs: 42, fat: 26, time: '30 perc', ingredients: '150 g lazacfilé, 200 g édesburgonya, spárga, citrom' },
      { id: 'p16', emoji: '🍳', name: 'Zöldséges omlett', category: 'Vacsora', calories: 340, protein: 24, carbs: 10, fat: 23, time: '12 perc', ingredients: '3 tojás, paprika, gomba, spenót, 30 g sajt' },
      { id: 'p17', emoji: '🦃', name: 'Pulykamell cukkini tésztával', category: 'Vacsora', calories: 420, protein: 44, carbs: 28, fat: 14, time: '25 perc', ingredients: '150 g pulykamell, 1 nagy cukkini, paradicsomszósz, parmezán' },
      { id: 'p18', emoji: '🥙', name: 'Csirkés wrap salátával', category: 'Vacsora', calories: 450, protein: 34, carbs: 42, fat: 16, time: '15 perc', ingredients: '1 teljes kiőrlésű tortilla, 100 g csirkemell, saláta, joghurtos öntet' }
    ];
    const getAllRecipes = () => [...presetRecipes, ...getCustomRecipes()];

    // ---------- Dátum navigáció ----------
    const formatDateLabel = (iso) => {
      const today = todayISO();
      const yest = toISO(new Date(Date.now() - 86400000));
      if (iso === today) return 'Ma';
      if (iso === yest) return 'Tegnap';
      return fromISO(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });
    };

    const shiftDate = (days) => {
      const d = fromISO(selectedDate);
      d.setDate(d.getDate() + days);
      const iso = toISO(d);
      if (iso > todayISO()) return;
      selectedDate = iso;
      renderAll();
    };

    // ---------- Megjelenítés ----------
    const renderFoods = () => {
      const foods = getFoods();
      const dailyTarget = getTarget();
      foodList.innerHTML = '';

      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      foods.forEach(item => {
        totalCalories += Number(item.calories);
        totalProtein += Number(item.protein || 0);
        totalCarbs += Number(item.carbs || 0);
        totalFat += Number(item.fat || 0);
      });

      if (foods.length === 0) {
        foodList.innerHTML = `<p class="empty-msg">Erre a napra még nem rögzítettél ételt.</p>`;
      } else {
        MEALS.forEach(meal => {
          const items = foods.filter(f => f.category === meal);
          if (!items.length) return;
          const sum = items.reduce((a, f) => a + Number(f.calories), 0);

          const head = document.createElement('div');
          head.className = 'meal-head';
          head.innerHTML = `<span>${meal}</span><span>${sum} kcal</span>`;
          foodList.appendChild(head);

          items.forEach(item => {
            const visual = item.emoji
              ? `<div class="food-img food-emoji">${esc(item.emoji)}</div>`
              : `<img src="${esc(item.image && item.image.trim() ? item.image : defaultImg)}" alt="${esc(item.name)}" class="food-img" onerror="this.src='${defaultImg}'">`;
            const macros = (Number(item.protein) || Number(item.carbs) || Number(item.fat))
              ? `| P: ${item.protein}g C: ${item.carbs}g F: ${item.fat}g` : '';
            const el = document.createElement('div');
            el.className = 'group-item';
            el.innerHTML = `
              <div class="food-card">
                ${visual}
                <div class="group-meta">
                  <h3>${esc(item.name)}</h3>
                  <p>${esc(item.calories)} kcal ${macros}</p>
                </div>
              </div>
              <button class="btn-join btn-danger delete-food-btn" data-id="${esc(item.id)}">
                Törlés
              </button>`;
            foodList.appendChild(el);
          });
        });
      }

      const remaining = dailyTarget - totalCalories;
      $('calorieTarget').textContent = `Napi kalóriakeret: ${dailyTarget.toLocaleString()} kcal`;
      $('calorieStats').textContent = remaining >= 0
        ? `Eddig bevíve: ${totalCalories.toLocaleString()} kcal | Megmaradt: ${remaining.toLocaleString()} kcal`
        : `Eddig bevíve: ${totalCalories.toLocaleString()} kcal | Túllépted: ${Math.abs(remaining).toLocaleString()} kcal`;

      const bar = $('calorieProgress');
      if (bar) {
        const pct = Math.min(100, Math.round(totalCalories / dailyTarget * 100));
        bar.style.width = pct + '%';
        bar.classList.toggle('over', remaining < 0);
        $('calorieProgressLabel').textContent = `${Math.round(totalCalories / dailyTarget * 100)}%`;
      }

      // Makrók: gramm + a kalóriából való arány
      $('totalProtein').textContent = `${totalProtein} g`;
      $('totalCarbs').textContent = `${totalCarbs} g`;
      $('totalFat').textContent = `${totalFat} g`;
      const macroKcal = totalProtein * 4 + totalCarbs * 4 + totalFat * 9;
      const pctOf = (kcal) => macroKcal ? Math.round(kcal / macroKcal * 100) : 0;
      $('pctProtein').textContent = `${pctOf(totalProtein * 4)}%`;
      $('pctCarbs').textContent = `${pctOf(totalCarbs * 4)}%`;
      $('pctFat').textContent = `${pctOf(totalFat * 9)}%`;

      $('dateLabel').textContent = formatDateLabel(selectedDate);
      $('nextDayBtn').disabled = selectedDate >= todayISO();
      $('foodSectionTitle').textContent = selectedDate === todayISO() ? 'Mai étkezések' : `Étkezések – ${formatDateLabel(selectedDate)}`;
    };

    const renderWater = () => {
      const ml = getWater();
      $('waterStats').textContent = `${(ml / 1000).toFixed(2).replace(/\.?0+$/, '')} / ${(WATER_GOAL / 1000)} l`;
      $('waterFill').style.width = Math.min(100, ml / WATER_GOAL * 100) + '%';
      const glasses = $('waterGlasses');
      const total = WATER_GOAL / WATER_STEP;
      const filled = Math.floor(ml / WATER_STEP);
      glasses.innerHTML = Array.from({ length: Math.max(total, filled) }, (_, i) =>
        `<span class="glass ${i < filled ? 'on' : ''}">💧</span>`).join('');
    };

    const renderWeek = () => {
      const wrap = $('weekChart');
      const all = getAllFoods();
      const target = getTarget();
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const iso = toISO(d);
        const kcal = all.filter(f => f.date === iso).reduce((a, f) => a + Number(f.calories), 0);
        days.push({ iso, kcal, label: d.toLocaleDateString('hu-HU', { weekday: 'short' }) });
      }
      const max = Math.max(target * 1.15, ...days.map(d => d.kcal));
      wrap.innerHTML = days.map(d => `
        <button type="button" class="week-col ${d.iso === selectedDate ? 'sel' : ''}" data-date="${d.iso}" title="${d.kcal} kcal">
          <span class="week-val">${d.kcal || ''}</span>
          <span class="week-bar-wrap"><span class="week-bar ${d.kcal > target ? 'over' : ''}" style="height:${d.kcal / max * 100}%"></span></span>
          <span class="week-lbl">${d.label}</span>
        </button>`).join('');
      const vals = days.filter(d => d.kcal > 0);
      $('weekAvg').textContent = vals.length
        ? `7 napos átlag: ${Math.round(vals.reduce((a, d) => a + d.kcal, 0) / vals.length).toLocaleString()} kcal / nap`
        : 'Még nincs adat az elmúlt 7 napból.';
    };

    const renderAll = () => { renderFoods(); renderWater(); renderWeek(); };

    // ---------- Étel hozzáadása / törlés ----------
    const addFoodEntry = (entry) => {
      const all = getAllFoods();
      all.push({ id: newId(), date: selectedDate, image: '', ...entry });
      saveAllFoods(all);
      renderAll();
    };

    foodList.addEventListener('click', (e) => {
      const btn = e.target.closest('.delete-food-btn');
      if (!btn) return;
      saveAllFoods(getAllFoods().filter(f => f.id !== btn.dataset.id));
      renderAll();
    });

    if (editTargetBtn) {
      editTargetBtn.addEventListener('click', () => {
        const newTarget = prompt('Add meg az új napi kalóriakeretet (kcal):', getTarget());
        if (newTarget && !isNaN(newTarget) && Number(newTarget) > 0) {
          localStorage.setItem(targetStorageKey, newTarget);
          renderAll();
        }
      });
    }

    if (openFoodModalBtn && closeFoodModalBtn && foodModal) {
      openFoodModalBtn.addEventListener('click', () => foodModal.classList.add('open'));
      closeFoodModalBtn.addEventListener('click', () => foodModal.classList.remove('open'));
    }

    if (addFoodForm) {
      addFoodForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const entry = {
          category: $('food-category').value,
          name: $('food-name').value.trim(),
          calories: Number($('food-calories').value),
          image: $('food-image').value.trim(),
          protein: Number($('food-protein').value) || 0,
          carbs: Number($('food-carbs').value) || 0,
          fat: Number($('food-fat').value) || 0
        };
        const saveBox = $('food-save-recipe');
        if (saveBox && saveBox.checked) {
          const customs = getCustomRecipes();
          customs.push({ id: 'c_' + newId(), emoji: '⭐', time: '', ingredients: 'Saját recept', custom: true, ...entry });
          saveCustomRecipes(customs);
        }
        addFoodEntry(entry);
        addFoodForm.reset();
        foodModal.classList.remove('open');
      });
    }

    // ---------- Receptkönyv ----------
    const recipeModal = $('recipeModal');
    const recipeListEl = $('recipeList');

    const renderRecipes = () => {
      const q = recipeQuery.trim().toLowerCase();
      const list = getAllRecipes().filter(r => {
        const catOk = recipeFilter === 'Mind' || (recipeFilter === 'Saját' ? r.custom : r.category === recipeFilter);
        return catOk && (!q || r.name.toLowerCase().includes(q) || (r.ingredients || '').toLowerCase().includes(q));
      });

      document.querySelectorAll('#recipeChips .chip').forEach(c => c.classList.toggle('active', c.dataset.cat === recipeFilter));

      if (!list.length) {
        recipeListEl.innerHTML = `<p class="empty-msg">Nincs találat.</p>`;
        return;
      }

      recipeListEl.innerHTML = list.map(r => `
        <div class="recipe-item">
          <div class="recipe-top">
            <div class="food-img food-emoji">${esc(r.emoji || '🍽️')}</div>
            <div class="group-meta recipe-meta">
              <h3>${esc(r.name)}</h3>
              <p>${esc(r.category)} · ${r.calories} kcal · P ${r.protein}g · Ch ${r.carbs}g · Zs ${r.fat}g</p>
            </div>
          </div>
          <details class="recipe-details">
            <summary>Hozzávalók${r.time ? ' · ' + esc(r.time) : ''}</summary>
            <p>${esc(r.ingredients || '')}</p>
          </details>
          <div class="recipe-actions">
            <select class="portion" data-id="${esc(r.id)}" aria-label="Adag">
              <option value="0.5">½ adag</option>
              <option value="1" selected>1 adag</option>
              <option value="1.5">1½ adag</option>
              <option value="2">2 adag</option>
            </select>
            <button type="button" class="btn-primary btn-sm add-recipe-btn" data-id="${esc(r.id)}">Hozzáadás</button>
            ${r.custom ? `<button type="button" class="btn-join btn-danger del-recipe-btn" data-id="${esc(r.id)}">Törlés</button>` : ''}
          </div>
        </div>`).join('');
    };

    if (recipeModal) {
      $('openRecipeModalBtn').addEventListener('click', () => { renderRecipes(); recipeModal.classList.add('open'); });
      $('closeRecipeModalBtn').addEventListener('click', () => recipeModal.classList.remove('open'));
      recipeModal.addEventListener('click', (e) => { if (e.target === recipeModal) recipeModal.classList.remove('open'); });

      $('recipeSearch').addEventListener('input', (e) => { recipeQuery = e.target.value; renderRecipes(); });
      $('recipeChips').addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        recipeFilter = chip.dataset.cat;
        renderRecipes();
      });

      recipeListEl.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.add-recipe-btn');
        const delBtn = e.target.closest('.del-recipe-btn');

        if (addBtn) {
          const r = getAllRecipes().find(x => x.id === addBtn.dataset.id);
          if (!r) return;
          const sel = addBtn.parentElement.querySelector('.portion');
          const p = Number(sel.value) || 1;
          const portionLabel = { '0.5': '½', '1.5': '1½', '2': '2' }[sel.value];
          addFoodEntry({
            category: MEALS.includes(r.category) ? r.category : 'Ebéd',
            name: p === 1 ? r.name : `${r.name} (${portionLabel} adag)`,
            emoji: r.emoji,
            calories: Math.round(r.calories * p),
            protein: Math.round(r.protein * p),
            carbs: Math.round(r.carbs * p),
            fat: Math.round(r.fat * p)
          });
          addBtn.textContent = '✓ Hozzáadva';
          setTimeout(() => { addBtn.textContent = 'Hozzáadás'; }, 1200);
        }

        if (delBtn) {
          if (!confirm('Biztosan törlöd ezt a saját receptet?')) return;
          saveCustomRecipes(getCustomRecipes().filter(x => x.id !== delBtn.dataset.id));
          renderRecipes();
        }
      });
    }

    // ---------- Víz, napváltás, heti diagram ----------
    $('waterAddBtn').addEventListener('click', () => { setWater(getWater() + WATER_STEP); renderWater(); });
    $('waterSubBtn').addEventListener('click', () => { setWater(getWater() - WATER_STEP); renderWater(); });
    $('prevDayBtn').addEventListener('click', () => shiftDate(-1));
    $('nextDayBtn').addEventListener('click', () => shiftDate(1));
    $('todayBtn').addEventListener('click', () => { selectedDate = todayISO(); renderAll(); });
    $('weekChart').addEventListener('click', (e) => {
      const col = e.target.closest('.week-col');
      if (!col) return;
      selectedDate = col.dataset.date;
      renderAll();
    });

    // ---------- Előző napi étkezések másolása ----------
    $('copyYesterdayBtn').addEventListener('click', () => {
      const d = fromISO(selectedDate); d.setDate(d.getDate() - 1);
      const prev = getAllFoods().filter(f => f.date === toISO(d));
      if (!prev.length) { alert('Az előző napon nincs rögzített étel.'); return; }
      if (!confirm(`${prev.length} étel másolása az előző napról?`)) return;
      const all = getAllFoods();
      prev.forEach(f => all.push({ ...f, id: newId(), date: selectedDate }));
      saveAllFoods(all);
      renderAll();
    });

    // ---------- Napi adatok exportálása ----------
    $('exportBtn').addEventListener('click', () => {
      const rows = [['Dátum', 'Étkezés', 'Étel', 'kcal', 'Fehérje (g)', 'Szénhidrát (g)', 'Zsír (g)']];
      getAllFoods().sort((a, b) => a.date.localeCompare(b.date)).forEach(f =>
        rows.push([f.date, f.category, `"${String(f.name).replace(/"/g, '""')}"`, f.calories, f.protein || 0, f.carbs || 0, f.fat || 0]));
      const blob = new Blob(['\ufeff' + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'kaloria-naplo.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    renderAll();
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

  // Továbbfejlesztett és rugalmas szövegfeldolgozó
  const getPresetSchedule = (type, customText) => {
    if (type === 'fullbody') {
      return [
        { day: 'Hétfő', name: 'Full Body A (Mell, Láb, Hát)', details: ['Guggolás rúddal: 4x8', 'Fekvenyomás: 4x8', 'Döntött törzsű evezés: 4x10', 'Vállból nyomás: 3x10'] },
        { day: 'Kedd', name: 'Pihenőnap', details: ['Regeneráció, könnyű séta'] },
        { day: 'Szerda', name: 'Full Body B (Erőfókusz)', details: ['Felhúzás: 4x6', 'Ferde pados nyomás: 4x8', 'Lehúzás csigán: 4x10', 'Bicepsz & Tricepsz: 3x12'] },
        { day: 'Csütörtök', name: 'Pihenőnap', details: ['Pihenés'] },
        { day: 'Péntek', name: 'Full Body C (Volumen)', details: ['Lábtolás: 4x12', 'Tolódzkodás: 3x10', 'T-rúdos evezés: 4x10', 'Oldalemelés: 4x12'] },
        { day: 'Szombat', name: 'Pihenőnap / Aktiválás', details: ['Könnyű kardió, nyújtás'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Teljes pihenőnap'] }
      ];
    } else if (type === 'ppl') {
      return [
        { day: 'Hétfő', name: 'Push (Mell, Váll, Tricepsz)', details: ['Fekvenyomás: 4x8', 'Mellről nyomás: 3x10', 'Kézi súlyzós tárogatás: 3x12', 'Tricepsz letolás: 4x12'] },
        { day: 'Kedd', name: 'Pull (Hát, Bicepsz, Hátsó váll)', details: ['Húzódzkodás / Mellhez húzás: 4x8', 'Evezés kézi súlyzóval: 4x10', 'Facepull: 3x15', 'Bicepsz franciarúddal: 3x12'] },
        { day: 'Szerda', name: 'Legs (Láb, Vádli, Has)', details: ['Guggolás: 4x8', 'Román felhúzás: 4x10', 'Lábnyújtás & Hajítás: 3x12', 'Vádli állva: 4x15'] },
        { day: 'Csütörtök', name: 'Pihenőnap', details: ['Regenerálódás'] },
        { day: 'Péntek', name: 'Push / Pull Kevert', details: ['Ferde pados nyomás: 4x10', 'Döntött törzsű evezés: 4x10', 'Oldalemelés: 4x15'] },
        { day: 'Szombat', name: 'Láb & Has', details: ['Lábtolás: 4x12', 'Kitörések: 3x10/láb', 'Hasprés csigán: 4x15'] },
        { day: 'Vasárnap', name: 'Pihenőnap', details: ['Pihenés'] }
      ];
    } else {
      const days = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];
      
      // Feldolgozzuk a beírt szöveget: szétbontjuk vesszők vagy új sorok szerint
      let rawItems = customText
        ? customText.split(/[\n,]+/).map(item => item.trim()).filter(item => item.length > 0)
        : [];

      // Ha nincs megadva semmi, akkor alapértelmezett üzenet
      if (rawItems.length === 0) {
        rawItems = ['Guggolás 4x8', 'Fekvenyomás 4x8', 'Evezés 4x10'];
      }

      // Ellenőrizzük, hogy vannak-e megadva specifikus napnevek (pl. Hétfő: Guggolás)
      const hasDayNames = rawItems.some(item => days.some(d => item.toLowerCase().startsWith(d.toLowerCase())));

      if (hasDayNames) {
        return days.map((dayName, idx) => {
          const matchedItems = rawItems.filter(item => item.toLowerCase().startsWith(dayName.toLowerCase()));
          let details = matchedItems.map(item => item.replace(new RegExp(`^${dayName}:?`, 'i'), '').trim()).filter(i => i !== '');

          if (details.length === 0) {
            return {
              day: dayName,
              name: idx % 2 === 1 ? 'Pihenőnap' : 'Aktív pihenés',
              details: [idx % 2 === 1 ? 'Pihenés és regeneráció' : 'Séta, könnyű kardió']
            };
          }

          return {
            day: dayName,
            name: `${dayName} Edzés`,
            details: details
          };
        });
      } else {
        // Ha csak egy sima lista lett beírva (pl. "Guggolás 4x8, Fekvenyomás 4x8, Evezés 3x10")
        // Akkor az edzésnapokra szétdobjuk a megadott gyakorlatokat
        return days.map((dayName, idx) => {
          if (idx === 0 || idx === 2 || idx === 4) { // Hétfő, Szerda, Péntek edzésnap
            return {
              day: dayName,
              name: `${dayName} Edzés`,
              details: rawItems
            };
          }
          return {
            day: dayName,
            name: 'Pihenőnap',
            details: ['Pihenés és regeneráció']
          };
        });
      }
    }
  };

  const getCustomPlans = () => JSON.parse(localStorage.getItem('customWorkoutPlans')) || {};
  const getAllWorkoutPlans = () => ({ ...defaultWorkoutPlans, ...getCustomPlans() });

  // DOM Elemek kiválasztása
  const openNewPlanModalBtn = document.getElementById('openNewPlanModalBtn');
  const closeNewPlanModalBtn = document.getElementById('closeNewPlanModalBtn');
  const newPlanModal = document.getElementById('newPlanModal');
  const createPlanForm = document.getElementById('createPlanForm');
  const workoutCardsContainer = document.getElementById('workoutCardsContainer');
  const planSplitSelect = document.getElementById('plan-split');
  const customExercisesGroup = document.getElementById('custom-exercises-group');

  if (planSplitSelect && customExercisesGroup) {
    planSplitSelect.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        customExercisesGroup.style.display = 'block';
      } else {
        customExercisesGroup.style.display = 'none';
      }
    });
  }

  if (openNewPlanModalBtn && closeNewPlanModalBtn && newPlanModal) {
    openNewPlanModalBtn.addEventListener('click', () => newPlanModal.classList.add('open'));
    closeNewPlanModalBtn.addEventListener('click', () => newPlanModal.classList.remove('open'));
  }

  const renderCustomWorkoutCards = () => {
    if (!workoutCardsContainer) return;

    const customPlans = getCustomPlans();
    Object.keys(customPlans).forEach(id => {
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
      const splitType = document.getElementById('plan-split').value;
      const customExercises = document.getElementById('plan-custom-exercises')?.value || '';
      const image = document.getElementById('plan-image').value.trim();

      const planId = 'custom_' + Date.now();

      const newPlan = {
        title,
        subtitle,
        description,
        image: image || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
        schedule: getPresetSchedule(splitType, customExercises)
      };

      const customPlans = getCustomPlans();
      customPlans[planId] = newPlan;
      localStorage.setItem('customWorkoutPlans', JSON.stringify(customPlans));

      createPlanForm.reset();
      if (customExercisesGroup) customExercisesGroup.style.display = 'none';
      newPlanModal.classList.remove('open');

      renderCustomWorkoutCards();
    });
  }

  renderCustomWorkoutCards();

  // RÉSZLETES NÉZET KEZELÉSE (WORKOUT-DETAIL.HTML)
  const detailContainer = document.getElementById('workoutDetailContent');
  if (detailContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('id') || '1';
    
    const allPlans = getAllWorkoutPlans();
    const plan = allPlans[planId] || allPlans['1'];

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
        <div class="section-header" style="font-size: 1.3rem; font-weight: 700; margin-bottom: 16px;">Heti Beosztás</div>
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