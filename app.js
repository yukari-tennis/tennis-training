const directions = ["右上", "右中", "右下", "左上", "左中", "左下"];

const speechText = {
  "右上": "みぎうえ",
  "右中": "みぎなか",
  "右下": "みぎした",
  "左上": "ひだりうえ",
  "左中": "ひだりなか",
  "左下": "ひだりした"
};

let timer = null;
let wakeLock = null;
let lastDirection = null;
let recentDirections = [];
let stats = {};

directions.forEach(direction => {
  stats[direction] = 0;
});

const directionEl = document.getElementById("direction");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const intervalSelect = document.getElementById("intervalSelect");
const voiceSelect = document.getElementById("voiceSelect");
const statsArea = document.getElementById("statsArea");

function chooseDirection() {
  let candidates = directions.filter(direction => direction !== lastDirection);

  const recentSet = new Set(recentDirections);
  candidates = candidates.filter(direction => !recentSet.has(direction));

  if (candidates.length === 0) {
    candidates = directions.filter(direction => direction !== lastDirection);
  }

  const minCount = Math.min(...candidates.map(direction => stats[direction]));
  const balancedCandidates = candidates.filter(direction => stats[direction] === minCount);

  return balancedCandidates[Math.floor(Math.random() * balancedCandidates.length)];
}

function speak(text) {
  if (voiceSelect.value === "off") return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  speechSynthesis.speak(utterance);
}

function showDirection() {
  const direction = chooseDirection();

  directionEl.textContent = direction;
  lastDirection = direction;

  recentDirections.push(direction);
  if (recentDirections.length > 2) {
    recentDirections.shift();
  }

  stats[direction]++;
  updateStats();
  speak(speechText[direction]);
}

async function keepScreenAwake() {
  if (!("wakeLock" in navigator)) {
    console.log("この端末では画面ロック防止に対応していません");
    return;
  }

  try {
    wakeLock = await navigator.wakeLock.request("screen");
    console.log("画面ロック防止を開始しました");
  } catch (error) {
    console.log("画面ロック防止に失敗しました", error);
  }
}

async function releaseScreenAwake() {
  if (wakeLock) {
    try {
      await wakeLock.release();
      wakeLock = null;
      console.log("画面ロック防止を解除しました");
    } catch (error) {
      console.log("画面ロック防止の解除に失敗しました", error);
    }
  }
}

function start() {
  if (timer) return;

  keepScreenAwake();

  showDirection();

  const interval = Number(intervalSelect.value);
  timer = setInterval(showDirection, interval);
}

function stop() {
  clearInterval(timer);
  timer = null;
  speechSynthesis.cancel();
  releaseScreenAwake();
}

function reset() {
  stop();

  directions.forEach(direction => {
    stats[direction] = 0;
  });

  lastDirection = null;
  recentDirections = [];
  directionEl.textContent = "待機中";
  updateStats();
}

function updateStats() {
  statsArea.innerHTML = "";

  directions.forEach(direction => {
    const item = document.createElement("div");
    item.className = "stat-item";

    item.innerHTML = `
      <div class="stat-label">${direction}</div>
      <div class="stat-count">${stats[direction]}</div>
    `;

    statsArea.appendChild(item);
  });
}

startBtn.addEventListener("click", start);
stopBtn.addEventListener("click", stop);
resetBtn.addEventListener("click", reset);

intervalSelect.addEventListener("change", () => {
  if (timer) {
    stop();
    start();
  }
});

updateStats();