let capture;
let handPose;
let hands = [];
let choices = ['石頭', '布', '剪刀'];
let playerChoice = "";
let computerChoice = "";
let resultMessage = "";
let gameState = "WAITING"; // WAITING, COUNTDOWN, RESULT
let timer = 3;
let lastTimestamp = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  // 初始化手勢偵測
  handPose = ml5.handPose(capture, () => {
    console.log("手勢模型載入完成");
  });
  // 持續偵測手部
  handPose.detectStart(capture, (results) => {
    hands = results;
  });
}

function draw() {
  background('#e7c6ff');

  // 影像處理：在中間、50% 大小、左右顛倒
  push();
  translate(width / 2, height / 2);
  scale(-1, 1);
  imageMode(CENTER);
  image(capture, 0, 0, width * 0.5, height * 0.5);
  
  // 如果有偵測到手，可以在這裡畫出關節點（可選）
  if (hands.length > 0) {
    drawHandMarkers();
  }
  pop();

  // 遊戲邏輯與 UI
  textAlign(CENTER, CENTER);
  fill(50);
  textSize(32);
  text("手勢感應猜拳", width / 2, 50);

  if (hands.length > 0) {
    let currentGesture = getGesture(hands[0]);
    
    if (gameState === "WAITING") {
      textSize(24);
      text(`偵測中... 目前手勢：${currentGesture}`, width / 2, height * 0.8);
      if (currentGesture !== "未知" && frameCount % 60 === 0) {
        gameState = "COUNTDOWN";
        timer = 3;
      }
    } else if (gameState === "COUNTDOWN") {
      textSize(60);
      text(timer, width / 2, height / 2);
      if (frameCount % 60 === 0 && timer > 0) {
        timer--;
      }
      if (timer === 0) {
        playGame(currentGesture);
        gameState = "RESULT";
        lastTimestamp = millis();
      }
    }
  } else {
    textSize(20);
    text("請將手放在攝影機前", width / 2, height * 0.8);
  }

  if (gameState === "RESULT") {
    textSize(30);
    fill(255, 0, 0);
    text(`你出：${playerChoice}  vs  電腦出：${computerChoice}`, width / 2, height * 0.8);
    textSize(50);
    text(resultMessage, width / 2, height * 0.9);
    
    // 顯示結果 3 秒後重置
    if (millis() - lastTimestamp > 3000) {
      gameState = "WAITING";
    }
  }
}

// 辨識邏輯：根據手指尖端 (Tip) 是否高於關節來判斷手指是否伸直
function getGesture(hand) {
  let keypoints = hand.keypoints;
  // 檢查食指、中指、無名指、小指
  let f8 = keypoints[8].y < keypoints[6].y;  // 食指
  let f12 = keypoints[12].y < keypoints[10].y; // 中指
  let f16 = keypoints[16].y < keypoints[14].y; // 無名指
  let f20 = keypoints[20].y < keypoints[18].y; // 小指

  let count = [f8, f12, f16, f20].filter(v => v).length;

  if (count === 0) return "石頭";
  if (count === 2 && f8 && f12) return "剪刀";
  if (count >= 3) return "布";
  return "未知";
}

function playGame(pChoice) {
  if (pChoice === "未知") pChoice = "石頭"; // 預設防呆
  playerChoice = pChoice; 
  computerChoice = random(choices);

  if (playerChoice === computerChoice) {
    resultMessage = "平手！";
  } else if (
    (playerChoice === '石頭' && computerChoice === '剪刀') ||
    (playerChoice === '布' && computerChoice === '石頭') ||
    (playerChoice === '剪刀' && computerChoice === '布')
  ) {
    resultMessage = "你贏了！";
  } else {
    resultMessage = "你輸了！";
  }
}

function drawHandMarkers() {
  // 在預覽圖上標示手部重點
  fill(0, 255, 0);
  noStroke();
  let hand = hands[0];
  for (let i = 0; i < hand.keypoints.length; i++) {
    let kp = hand.keypoints[i];
    // 縮放到 50% 畫布大小
    let x = (kp.x - 320) * (width * 0.5 / 640);
    let y = (kp.y - 240) * (height * 0.5 / 480);
    ellipse(x, y, 10, 10);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}