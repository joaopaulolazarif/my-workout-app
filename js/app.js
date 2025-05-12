const workouts = {
  A: {
    name: "Peito/Tríceps + Abdômen",
    exercises: [
      { name: "Supino Reto", sets: 4, reps: 12, weight: 20 },
      { name: "Supino Inclinado Halteres", sets: 3, reps: 15, weight: 16 },
      { name: "Crucifixo Máquina", sets: 3, reps: 15, weight: 30 },
      { name: "Tríceps Testa", sets: 3, reps: 12, weight: 22 }
    ]
  },
  B: {
    name: "Costas/Bíceps",
    exercises: [
      { name: "Puxada Aberta", sets: 4, reps: 12, weight: 45 },
      { name: "Remada Curvada", sets: 3, reps: 15, weight: 30 },
      { name: "Rosca Direta", sets: 3, reps: 12, weight: 10 }
    ]
  },
  C: {
    name: "Pernas",
    exercises: [
      { name: "Agachamento", sets: 4, reps: 10, weight: 15 },
      { name: "Leg Press 45°", sets: 3, reps: 10, weight: 50 },
      { name: "Cadeira Extensora", sets: 3, reps: 12, weight: 40 },
      { name: "Cadeira Flexora", sets: 3, reps: 12, weight: 30 },
      { name: "Panturrilha Sentada", sets: 3, reps: 15, weight: 90 }
    ]
  },
  D: {
    name: "Ombro/Glúteo/Posterior + Abdômen",
    exercises: [
      { name: "Desenvolvimento Halter", sets: 4, reps: 10, weight: 14 },
      { name: "Elevação Lateral", sets: 3, reps: 12, weight: 9 },
      { name: "Crucifixo Invertido Halteres", sets: 3, reps: 12, weight: 0 },
      { name: "Glúteo Máquina", sets: 3, reps: 12, weight: 20 },
      { name: "Face Pull", sets: 2, reps: 12, weight: 10 }
    ]
  }
};

const treinoOrder = ['A', 'B', 'C', 'D'];
let currentWorkout = null;
let timerInterval = null;
let timerSeconds = 0;
let lastSavedProgress = null;

function getTreinoLabel(letter) {
  switch (letter) {
    case 'A': return 'TREINO A';
    case 'B': return 'TREINO B';
    case 'C': return 'TREINO C';
    case 'D': return 'TREINO D';
    default: return '';
  }
}

function renderWorkout() {
  const workout = workouts[currentWorkout];

  // Navegação entre treinos
  const currentIdx = treinoOrder.indexOf(currentWorkout);
  const prevTreino = treinoOrder[(currentIdx - 1 + treinoOrder.length) % treinoOrder.length];
  const nextTreino = treinoOrder[(currentIdx + 1) % treinoOrder.length];

  document.getElementById('workoutNav').innerHTML = `
    <div class="workout-nav">
      <button class="workout-nav-btn" onclick="handleChangeTreino('${prevTreino}')" title="Treino anterior">←</button>
      <div class="workout-nav-label">${getTreinoLabel(currentWorkout)}</div>
      <button class="workout-nav-btn" onclick="handleChangeTreino('${nextTreino}')" title="Próximo treino">→</button>
    </div>
  `;

  // Destaque do treino selecionado no topo
  document.getElementById('workoutHeader').innerHTML = `
    <div class="workout-header-card">
      <div class="workout-header-title">${getTreinoLabel(currentWorkout)}</div>
      <div class="workout-header-desc">${workout.name}</div>
    </div>
  `;

  let html = "";
  workout.exercises.forEach((ex, index) => {
    html += `
      <div class="exercise-card">
        <div class="exercise-header">
          <div class="exercise-title">${ex.name}</div>
          <input type="checkbox" id="done-${index}" style="transform:scale(1.3);" onchange="toggleDone(${index})">
        </div>
        <div class="exercise-controls">
          <div class="control-group">
            <button class="control-btn" onclick="adjustValue(${index}, 'sets', -1)">-</button>
            <span class="control-value" id="sets-${index}">${ex.sets}</span>
            <button class="control-btn" onclick="adjustValue(${index}, 'sets', 1)">+</button>
            <span style="margin:0 10px;">x</span>
            <button class="control-btn" onclick="adjustValue(${index}, 'reps', -1)">-</button>
            <span class="control-value" id="reps-${index}">${ex.reps}</span>
            <button class="control-btn" onclick="adjustValue(${index}, 'reps', 1)">+</button>
          </div>
          <div class="control-group">
            <button class="control-btn" onclick="adjustValue(${index}, 'weight', -1)">-</button>
            <span class="control-value" id="weight-${index}">${ex.weight}</span>
            <button class="control-btn" onclick="adjustValue(${index}, 'weight', 1)">+</button>
            <span>kg</span>
          </div>
        </div>
      </div>
    `;
  });
  document.getElementById('workoutContent').innerHTML = html;
  loadExerciseProgress();

  // Salva o progresso atual como "lastSavedProgress"
  const saved = JSON.parse(localStorage.getItem(`progress_${currentWorkout}`));
  lastSavedProgress = saved ? JSON.parse(JSON.stringify(saved)) : getCurrentProgress();
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
  const current = getCurrentProgress();
  if (!lastSavedProgress || !current) return false;
  return JSON.stringify(current) !== JSON.stringify(lastSavedProgress);
}

function adjustValue(index, type, delta) {
  const element = document.getElementById(`${type}-${index}`);
  let value = parseInt(element.textContent) + delta;
  value = value < 0 ? 0 : value;
  element.textContent = value;
  saveExerciseProgress();
}

function toggleDone(index) {
  saveExerciseProgress();
}

function saveExerciseProgress() {
  const workout = workouts[currentWorkout];
  const progress = workout.exercises.map((ex, i) => ({
    sets: parseInt(document.getElementById(`sets-${i}`).textContent),
    reps: parseInt(document.getElementById(`reps-${i}`).textContent),
    weight: parseInt(document.getElementById(`weight-${i}`).textContent),
    done: document.getElementById(`done-${i}`).checked
  }));
  localStorage.setItem(`progress_${currentWorkout}`, JSON.stringify(progress));
}

function loadExerciseProgress() {
  const workout = workouts[currentWorkout];
  const progress = JSON.parse(localStorage.getItem(`progress_${currentWorkout}`));
  if (progress) {
    progress.forEach((ex, i) => {
      document.getElementById(`sets-${i}`).textContent = ex.sets;
      document.getElementById(`reps-${i}`).textContent = ex.reps;
      document.getElementById(`weight-${i}`).textContent = ex.weight;
      document.getElementById(`done-${i}`).checked = !!ex.done;
    });
  }
}

// Cronômetro
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
      saveToLocalStorage();
    }, 1000);
  }
}
function pauseTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  saveToLocalStorage();
}
function resetTimer() {
  timerSeconds = 0;
  updateTimerDisplay();
  saveToLocalStorage();
}
function saveToLocalStorage() {
  localStorage.setItem('timerSeconds', timerSeconds);
}
function loadSavedData() {
  timerSeconds = parseInt(localStorage.getItem('timerSeconds')) || 0;
  updateTimerDisplay();
}

// Histórico
function renderHistory() {
  const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
  const historyList = document.getElementById('historyList');
  if (!history.length) {
    historyList.innerHTML = `<div style="text-align:center; color:#888; margin-top:30px;">Nenhum treino salvo ainda.</div>`;
    return;
  }
  historyList.innerHTML = history
    .slice(0, 7)
    .map(entry => `<div class="history-item"><span class="history-date">${new Date(entry.date).toLocaleDateString()}</span><span class="history-workout">${entry.workout}</span></div>`)
    .join('');
}
function saveProgress() {
  const history = JSON.parse(localStorage.getItem('workoutHistory')) || [];
  history.unshift({
    date: new Date().getTime(),
    workout: workouts[currentWorkout].name
  });
  localStorage.setItem('workoutHistory', JSON.stringify(history.slice(0, 7)));
  showToast('Progresso salvo com sucesso!');
  lastSavedProgress = getCurrentProgress();
}
function clearProgress() {
  if (!currentWorkout) return;
  localStorage.removeItem(`progress_${currentWorkout}`);
  localStorage.removeItem('timerSeconds');
  renderWorkout();
  resetTimer();
  showToast('Progresso limpo com sucesso!');
  lastSavedProgress = getCurrentProgress();
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
      () => { saveProgress(); showMainScreen(); },
      () => { showMainScreen(); }
    );
  } else {
    showMainScreen();
  }
}

// Navegação entre treinos protegida
function handleChangeTreino(targetTreino) {
  if (isProgressChanged()) {
    showConfirmExitToast(
      () => { saveProgress(); loadWorkout(targetTreino); },
      () => { loadWorkout(targetTreino); }
    );
  } else {
    loadWorkout(targetTreino);
  }
}

function loadWorkout(type) {
  currentWorkout = type;
  document.getElementById('mainScreen').style.display = 'none';
  document.getElementById('workoutScreen').style.display = 'block';
  document.getElementById('historyScreen').style.display = 'none';
  renderWorkout();
  loadSavedData();
}
