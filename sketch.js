let capture;
let handPose;
let hands = [];
let choices = ['石頭', '布', '剪刀'];
let playerChoice = "";
let computerChoice = "";
let resultMessage = "";
let gameState = "WAITING"; // WAITING, COUNTDOWN, RESULT, FINISHED
let timer = 3;
let lastTimestamp = 0;

function preload() {
  // 在 preload 中初始化模型
  handPose = ml5.handPose();
}

function gotHands(results) {
  // 更新偵測結果的回調函式
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 設定攝影機
  capture = createCapture(VIDEO);
  capture.size(640, 480);
  capture.hide();

  // 開始持續偵測
  handPose.detectStart(capture, gotHands);
}

function draw() {
  if (gameState === "FINISHED") {
    background(0);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(60);
    text("遊戲結束", width / 2, height / 2);
    textSize(24);
    text("請重新整理網頁以再次開始", width / 2, height / 2 + 80);
    return;
  }

  // 背景改為藍色
  background('blue');

  // 影像處理：在中間、50% 大小、左右顛倒
  push();
  translate(width / 2, height / 2);
  scale(-1, 1);
  imageMode(CENTER);
  image(capture, 0, 0, width * 0.5, height * 0.5);
  
  for (let i = 0; i < hands.length; i++) {
    drawHandSkeleton(hands[i]); // 繪製所有偵測到的手部骨架
  }
  pop();

  // 遊戲邏輯與 UI
  textAlign(CENTER, CENTER);
  fill(50);
  textSize(32); fill(255); // 主標題保持白色
  text("手勢感應猜拳", width / 2, 50);

  if (hands.length > 0) {
    let currentGesture = getGesture(hands[0]);
    
    if (gameState === "WAITING") {
      textSize(24);
      text(`偵測手勢中：${currentGesture}`, width / 2, height * 0.83); // 移至攝影機下方
      // 如果偵測到有效手勢，且準備好則進入倒數
      if (currentGesture !== "未知" && gameState === "WAITING") {
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
    text("請將手放在攝影機前", width / 2, height * 0.83); // 移至攝影機下方
  }

  if (gameState === "RESULT") {
    textSize(20);
    fill(255); // 白色文字
    text("繼續：雙手全開 (🖐️🖐️) | 結束：比倒讚 (👎)", width / 2, height * 0.79); // 移至攝影機下方

    textSize(26);
    fill(255); // 白色文字
    text(`你出：${playerChoice}  vs  電腦：${computerChoice}`, width / 2, height * 0.85); // 調整位置

    let emoji = "";
    if (resultMessage === "你贏了！") {
      emoji = "🏆";
    } else if (resultMessage === "你輸了！") {
      emoji = "🔥";
    }
    textSize(36); // 縮小文字大小以符合需求
    text(`${resultMessage} ${emoji}`, width / 2, height * 0.91); // 調整位置避免壓到上方文字

    // 1. 偵測到兩個全開的手掌就繼續遊戲
    if (hands.length === 2) {
      if (getGesture(hands[0]) === "布" && getGesture(hands[1]) === "布") {
        gameState = "WAITING";
      }
    }

    // 2. 偵測到倒讚就結束遊戲
    for (let h of hands) {
      if (getGesture(h) === "倒讚") {
        gameState = "FINISHED";
      }
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

  // 倒讚辨識：四指握拳，且大拇指尖 (點4) 低於大拇指關節 (點2)
  let thumbDown = keypoints[4].y > keypoints[2].y;

  if (count === 0) {
    if (thumbDown) return "倒讚";
    return "石頭";
  }
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

function drawHandSkeleton(hand) {
  
  // 1. 繪製骨架連接線
  stroke(255, 255, 0); // 黃色線條
  strokeWeight(3);
  
  // 這裡使用 ml5 提供的手指連線邏輯 (簡化版)
  // 每個手指的四個點連起來
  let fingerIndices = [
    [0, 1, 2, 3, 4],     // 大拇指
    [0, 5, 6, 7, 8],     // 食指
    [0, 9, 10, 11, 12],  // 中指
    [0, 13, 14, 15, 16], // 無名指
    [0, 17, 18, 19, 20]  // 小指
  ];

  for (let finger of fingerIndices) {
    for (let i = 0; i < finger.length - 1; i++) {
      let p1 = hand.keypoints[finger[i]];
      let p2 = hand.keypoints[finger[i+1]];
      line(mapToCanvas(p1.x, 'x'), mapToCanvas(p1.y, 'y'), 
           mapToCanvas(p2.x, 'x'), mapToCanvas(p2.y, 'y'));
    }
  }

  // 2. 繪製節點 (使用你提供的綠色圓圈樣式)
  noStroke();
  fill(0, 255, 0); // 綠色節點
  for (let i = 0; i < hand.keypoints.length; i++) {
    let kp = hand.keypoints[i];
    circle(mapToCanvas(kp.x, 'x'), mapToCanvas(kp.y, 'y'), 10);
  }
}

// 輔助函式：將攝影機座標精確映射到畫布上的 50% 置中影像位置
function mapToCanvas(val, axis) {
  if (axis === 'x') {
    return map(val, 0, capture.width, -width * 0.25, width * 0.25);
  } else {
    return map(val, 0, capture.height, -height * 0.25, height * 0.25);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}