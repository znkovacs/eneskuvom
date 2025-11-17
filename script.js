// Mozgó háttér animáció (unchanged)
var bgCanvas = document.getElementById('animatedBackground');
var bgCtx = bgCanvas.getContext('2d');
function resizeBG() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBG);
resizeBG();

var width = bgCanvas.width;
var height = bgCanvas.height;
var flowers = [];

for (let i = 0; i < 60; i++) {
  flowers.push({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 8 + Math.random() * 6,
    dx: (Math.random() - 0.5) * 0.13,
    dy: (Math.random() - 0.5) * 0.13,
    opacity: 0.23 + Math.random() * 0.33
  });
}

function drawFlowers() {
  bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
  flowers.forEach(f => {
    f.x += f.dx;
    f.y += f.dy;
    if (f.x < 0) f.x = width;
    if (f.x > width) f.x = 0;
    if (f.y < 0) f.y = height;
    if (f.y > height) f.y = 0;

    let gradient = bgCtx.createRadialGradient(f.x, f.y, 1, f.x, f.y, f.radius);
    gradient.addColorStop(0, `rgba(255, 220, 230, ${f.opacity})`);
    gradient.addColorStop(1, `rgba(255, 182, 193, 0)`);
    bgCtx.fillStyle = gradient;
    bgCtx.beginPath();
    bgCtx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
    bgCtx.fill();
  });
  requestAnimationFrame(drawFlowers);
}
drawFlowers();

// Kaparós kép és logika (unchanged)
var bridge = document.getElementById("bridge"),
    bridgeCanvas = bridge.getContext('2d'),
    brushRadius = (bridge.width / 100) * 5,
    img = new Image();

if (brushRadius < 50) { brushRadius = 50; }

img.onload = function () {
  bridgeCanvas.drawImage(img, 0, 0, bridge.width, bridge.height);
};

img.src = 'pic0.png';

// Új: zene lejátszása helyben

var music = new Audio('music.mp3');  // Helyi mp3 fájl
music.loop = true;
var hasStartedMusic = false;

function startMusicOnScratch() {
  if (!hasStartedMusic) {
    music.play().catch(e => {
      console.log("Playback error:", e);
    });
    hasStartedMusic = true;
  }
}

function detectLeftButton(event) {
  if ('buttons' in event) {
    return event.buttons === 1;
  } else if ('which' in event) {
    return event.which === 1;
  } else {
    return event.button === 1;
  }
}

function getBrushPos(xRef, yRef) {
  var bridgeRect = bridge.getBoundingClientRect();
  return {
    x: Math.floor((xRef - bridgeRect.left) / (bridgeRect.right - bridgeRect.left) * bridge.width),
    y: Math.floor((yRef - bridgeRect.top) / (bridgeRect.bottom - bridgeRect.top) * bridge.height)
  };
}

function drawDot(mouseX, mouseY) {
  if (!hasStartedMusic) {
    startMusicOnScratch();
  }
  bridgeCanvas.globalCompositeOperation = "destination-out";
  bridgeCanvas.beginPath();
  bridgeCanvas.arc(mouseX, mouseY, brushRadius, 0, 2 * Math.PI, true);
  bridgeCanvas.fill();
  bridgeCanvas.globalCompositeOperation = "source-over";
}

bridge.addEventListener("mousemove", function (e) {
  var brushPos = getBrushPos(e.clientX, e.clientY);
  var leftBut = detectLeftButton(e);
  if (leftBut === true || leftBut === 1) {
    drawDot(brushPos.x, brushPos.y);
  }
}, false);

bridge.addEventListener("touchmove", function (e) {
  e.preventDefault();
  var touch = e.targetTouches[0];
  if (touch) {
    var brushPos = getBrushPos(touch.pageX, touch.pageY);
    drawDot(brushPos.x, brushPos.y);
  }
}, false);
