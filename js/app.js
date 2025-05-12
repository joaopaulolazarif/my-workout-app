const MyWorkoutApp = (() => {
  const workouts = {
    A: { name: "Peito/Tríceps + Abdômen", exercises: [
      { name: "Supino Reto", sets: 4, reps: 12, weight: 20 },
      { name: "Supino Inclinado Halteres", sets: 3, reps: 15, weight: 16 },
      { name: "Crucifixo Máquina", sets: 3, reps: 15, weight: 30 },
      { name: "Tríceps Testa", sets: 3, reps: 12, weight: 22 }
    ]},
    B: { name: "Costas/Bíceps", exercises: [
      { name: "Puxada Aberta", sets: 4, reps: 12, weight: 45 },
      { name: "Remada Curvada", sets: 3, reps: 15, weight: 30 },
      { name: "Rosca Direta", sets: 3, reps: 12, weight: 10 }
    ]},
    C: { name: "Pernas", exercises: [
      { name: "Agachamento", sets: 4, reps: 10, weight: 15 },
      { name: "Leg Press 45°", sets: 3, reps: 10, weight: 50 },
      { name: "Cadeira Extensora", sets: 3, reps: 12, weight: 40 },
      { name: "Cadeira Flexora", sets: 3, reps: 12, weight: 30 },
      { name: "Panturrilha Sentada", sets: 3, reps: 15, weight: 90 }
    ]},
    D: { name: "Ombro/Glúteo/Posterior + Abdômen", exercises: [
      { name: "Desenvolvimento Halter", sets: 4, reps: 10, weight: 14 },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: 9 },
      { name: "Crucifixo Invertido Halteres", sets: 3, reps: 12, weight: 0 },
      { name: "Glúteo Máquina", sets: 3, reps: 12, weight: 20 },
      { name: "Face Pull", sets: 2, reps: 12, weight: 10 }
    ]}
  };
  const treinoOrder = ['A', 'B', 'C', 'D'];
  let currentWorkout = null;
  let timerInterval = null;
  let timerSeconds = 0;
  let lastSavedProgress = null;

  // Utils para localStorage
  function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function loadFromStorage(key, fallback = null) {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  }

  function getTreinoLabel(letter) {
    switch (letter) {
      case 'A': return 'TREINO A';
      case 'B': return 'TREINO B';
      case 'C': return 'TREINO C';
      case 'D': return 'TREINO D';
      default: return '';
    }
  }

  function renderExercise(ex, index) {
    return `
      <div class="exercise-card">
        <div class="exercise-header">
          <div class="exercise-title">
            ${ex.name}
            <button class="btn-chart" onclick="MyWorkoutApp.openChartModal('${ex.name}')" 
              title="Ver evolução" 
              aria-label="Ver evolução do exercício ${ex.name}">
              📈
            </button>
          </div>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
            <input type="checkbox" id="done-${index}" onchange="MyWorkoutApp.toggleDone(${index})" aria-label="Marcar exercício ${ex.name} como concluído">
          </label>
        </div>
        <div class="exercise-controls">
          <div class="control-group">
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'sets', -1)">-</button>
            <span class="control-value" id="sets-${index}">${ex.sets}</span>
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'sets', 1)">+</button>
            <span style="margin:0 10px;">x</span>
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'reps', -1)">-</button>
            <span class="control-value" id="reps-${index}">${ex.reps}</span>
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'reps', 1)">+</button>
          </div>
          <div class="control-group">
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'weight', -1)">-</button>
            <span class="control-value" id="weight-${index}">${ex.weight}</span>
            <button class="control-btn" onclick="MyWorkoutApp.adjustValue(${index}, 'weight', 1)">+</button>
            <span>kg</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderWorkout() {
    const workout = workouts[currentWorkout];
    const idx = treinoOrder.indexOf(currentWorkout);
    const prevTreino = treinoOrder[(idx - 1 + treinoOrder.length) % treinoOrder.length];
    const nextTreino = treinoOrder[(idx + 1) % treinoOrder.length];

    document.getElementById('workoutHeader').innerHTML = `
      <div class="workout-header-card">
        <div class="workout-header-nav-row">
          <button class="workout-header-nav-btn" onclick="MyWorkoutApp.handleChangeTreino('${prevTreino}')" title="Treino anterior" aria-label="Ir para o treino anterior">←</button>
          <span class="workout-header-title">${getTreinoLabel(currentWorkout)}</span>
          <button class="workout-header-nav-btn" onclick="MyWorkoutApp.handleChangeTreino('${nextTreino}')" title="Próximo treino" aria-label="Ir para o próximo treino">→</button>
        </div>
        <div class="workout-header-desc">${workout.name}</div>
      </div>
    `;

    let html = workout.exercises.map(renderExercise).join('');
    document.getElementById('workoutContent').innerHTML = html;
    MyWorkoutApp.loadExerciseProgress();

    // Salva o progresso atual como "lastSavedProgress"
    const saved = loadFromStorage(`progress_${currentWorkout}`);
    lastSavedProgress = saved ? JSON.parse(JSON.stringify(saved)) : MyWorkoutApp.getCurrentProgress();

    MyWorkoutApp.loadTimer();
    setTimeout(MyWorkoutApp.focusFirstExercise, 200);
  }

  function adjustValue(index, type, delta) {
    const element = document.getElementById(`${type}-${index}`);
    let value = parseInt(element.textContent) + delta;
    // Limita entre 0 e 1000
    value = Math.max(0, Math.min(value, 1000));
    element.textContent = value;
    MyWorkoutApp.saveExerciseProgress();
  }

  function toggleDone(index) {
    MyWorkoutApp.saveExerciseProgress();
  }

  function saveExerciseProgress() {
    const workout = workouts[currentWorkout];
    const progress = workout.exercises.map((ex, i) => ({
      sets: parseInt(document.getElementById(`sets-${i}`).textContent),
      reps: parseInt(document.getElementById(`reps-${i}`).textContent),
      weight: parseInt(document.getElementById(`weight-${i}`).textContent),
      done: document.getElementById(`done-${i}`).checked
    }));
    saveToStorage(`progress_${currentWorkout}`, progress);
  }

  function loadExerciseProgress() {
    const workout = workouts[currentWorkout];
    const progress = loadFromStorage(`progress_${currentWorkout}`);
    if (progress) {
      progress.forEach((ex, i) => {
        document.getElementById(`sets-${i}`).textContent = ex.sets;
        document.getElementById(`reps-${i}`).textContent = ex.reps;
        document.getElementById(`weight-${i}`).textContent = ex.weight;
        document.getElementById(`done-${i}`).checked = !!ex.done;
      });
    }
  }

  function getCurrentProgress() {
    const workout = workouts[currentWorkout];
    if (!workout) return null;
    return workout.exercises.map((ex, i) => ({
      sets: parseInt(document.getElementById(`sets-${i}`).textContent),
      reps: parseInt(document.getElementById(`reps-${i}`).textContent),
      weight: parseInt(document.getElementById(`weight-${i}`).textContent),
      done: document.getElementById(`done-${i}`).checked
    }));
  }

  function isProgressChanged() {
    const current = MyWorkoutApp.getCurrentProgress();
    if (!lastSavedProgress || !current) return false;
    return JSON.stringify(current) !== JSON.stringify(lastSavedProgress);
  }

  // Timer por ficha
  function updateTimerDisplay() {
    const hours = Math.floor(timerSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (timerSeconds % 60).toString().padStart(2, '0');
    document.getElementById('timer').textContent = `${hours}:${minutes}:${seconds}`;
  }
  function startTimer() {
    if(!timerInterval) {
      timerInterval = setInterval(() => {
        timerSeconds++;
        updateTimerDisplay();
        MyWorkoutApp.saveTimer();
      }, 1000);
    }
  }
  function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    MyWorkoutApp.saveTimer();
  }
  function resetTimer() {
    timerSeconds = 0;
    updateTimerDisplay();
    MyWorkoutApp.saveTimer();
  }
  function saveTimer() {
    if (currentWorkout) {
      localStorage.setItem(`timerSeconds_${currentWorkout}`, timerSeconds);
    }
  }
  function loadTimer() {
    timerSeconds = parseInt(localStorage.getItem(`timerSeconds_${currentWorkout}`)) || 0;
    updateTimerDisplay();
  }

  // Histórico
  function renderHistory() {
    const history = loadFromStorage('workoutHistory', []);
    const historyList = document.getElementById('historyList');
    if (!history.length) {
      historyList.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px;">Nenhum treino salvo ainda.</div>`;
      return;
    }
    historyList.innerHTML = history
      .slice(0, 7)
      .map(entry => `
        <div class="history-item">
          <span class="history-date">${new Date(entry.date).toLocaleDateString()}</span>
          <span class="history-workout">
            <strong>${entry.ficha || ''}</strong> ${entry.workout}
          </span>
        </div>
      `)
      .join('');
  }

  function saveProgress() {
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    const workout = workouts[currentWorkout];
    const progress = MyWorkoutApp.getCurrentProgress();
  
    // Salvar dados detalhados de cada exercício
    const exercisesData = workout.exercises.map((ex, i) => ({
      name: ex.name,
      sets: progress[i].sets,
      reps: progress[i].reps,
      weight: progress[i].weight
    }));
  
    history.unshift({
      date: new Date().getTime(),
      ficha: getTreinoLabel(currentWorkout),
      workout: workout.name,
      exercisesData
    });
    
    localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 7)));
    showToast('Progresso salvo com sucesso!');
    lastSavedProgress = MyWorkoutApp.getCurrentProgress();
    MyWorkoutApp.focusFirstExercise();
  }

  function clearProgress() {
    if (!currentWorkout) return;
    localStorage.removeItem(`progress_${currentWorkout}`);
    localStorage.removeItem(`timerSeconds_${currentWorkout}`);
    renderWorkout();
    resetTimer();
    showToast('Progresso limpo com sucesso!');
    lastSavedProgress = MyWorkoutApp.getCurrentProgress();
    MyWorkoutApp.focusFirstExercise();
  }

  function showMainScreen() {
    document.getElementById('mainScreen').style.display = 'block';
    document.getElementById('workoutScreen').style.display = 'none';
    document.getElementById('historyScreen').style.display = 'none';
    pauseTimer();
  }
  function showHistoryScreen() {
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('workoutScreen').style.display = 'none';
    document.getElementById('historyScreen').style.display = 'block';
    renderHistory();
  }

  // Toasts
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = "toast show";
    setTimeout(() => {
      toast.className = "toast";
    }, 2000);
  }

  // Confirmação ao sair com progresso não salvo
  function showConfirmExitToast(onSaveAndExit, onExit) {
    const toast = document.getElementById('confirm-exit-toast');
    document.getElementById('confirm-exit-msg').textContent = "Você fez alterações não salvas. Deseja salvar antes de sair?";
    toast.className = "toast show";
    toast.style.display = "block";
    document.getElementById('btn-save-exit').onclick = () => {
      toast.className = "toast";
      toast.style.display = "none";
      if (onSaveAndExit) onSaveAndExit();
    };
    document.getElementById('btn-exit').onclick = () => {
      toast.className = "toast";
      toast.style.display = "none";
      if (onExit) onExit();
    };
  }

  // Botão voltar protegido
  function handleExitWorkout() {
    if (isProgressChanged()) {
      showConfirmExitToast(
        () => { MyWorkoutApp.saveProgress(); MyWorkoutApp.showMainScreen(); },
        () => { MyWorkoutApp.showMainScreen(); }
      );
    } else {
      MyWorkoutApp.showMainScreen();
    }
  }

  // Navegação entre treinos protegida
  function handleChangeTreino(targetTreino) {
    if (isProgressChanged()) {
      showConfirmExitToast(
        () => { MyWorkoutApp.saveProgress(); MyWorkoutApp.loadWorkout(targetTreino); },
        () => { MyWorkoutApp.loadWorkout(targetTreino); }
      );
    } else {
      MyWorkoutApp.loadWorkout(targetTreino);
    }
  }

  function loadWorkout(type) {
    currentWorkout = type;
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('workoutScreen').style.display = 'block';
    document.getElementById('historyScreen').style.display = 'none';
    renderWorkout();
  }

  function focusFirstExercise() {
    const first = document.querySelector('.exercise-card input[type="checkbox"]');
    if (first) first.focus();
  }

  // Busca histórico do exercício
  function getExerciseHistory(exerciseName) {
    console.log(localStorage.getItem('workoutHistory'))
    const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
    return history
      .map(entry => {
        const ex = entry.exercisesData.find(e => e.name === exerciseName);
        return ex ? { 
          date: new Date(entry.date).toLocaleDateString(), 
          weight: ex.weight,
          reps: ex.reps 
        } : null;
      })
      .filter(Boolean);
  }

  // Controla o modal
  function openChartModal(exerciseName) {
    document.getElementById('chartTitle').textContent = `Evolução: ${exerciseName}`;
    document.getElementById('chartModal').style.display = 'block';
    renderExerciseChart(exerciseName);
  }

  function closeChartModal() {
    document.getElementById('chartModal').style.display = 'none';
  }

  // Renderiza gráfico com Chart.js (adicione o script Chart.js no HTML)
  function renderExerciseChart(exerciseName) {
    const data = getExerciseHistory(exerciseName);
    const ctx = document.getElementById('exerciseChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date),
        datasets: [{
          label: 'Carga (kg)',
          data: data.map(d => d.weight),
          borderColor: '#FFD700',
          tension: 0.1
        }, {
          label: 'Repetições',
          data: data.map(d => d.reps),
          borderColor: '#222',
          tension: 0.1
        }]
      }
    });
  }


  // Expor funções necessárias globalmente para HTML
  return {
    loadWorkout, showMainScreen, showHistoryScreen,
    renderWorkout, adjustValue, toggleDone,
    saveProgress, clearProgress, startTimer, pauseTimer, resetTimer,
    handleExitWorkout, handleChangeTreino,
    getCurrentProgress, saveExerciseProgress, loadExerciseProgress,
    focusFirstExercise, closeChartModal, openChartModal, loadTimer, saveTimer
  };
})();
