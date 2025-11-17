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


// Kaparós kép és logika (kept, with safe preload)
var bridge = document.getElementById("bridge"),
    bridgeCanvas = bridge.getContext('2d'),
    brushRadius = (bridge.width / 100) * 5;

// Keep your original minimum radius logic
if (brushRadius < 50) { brushRadius = 50; }

// NEW: preload images in order so pic0 draws before pic1 is shown
var underlyingImgEl = document.getElementById('underlyingImage');

// Hide underlying until overlay drawn and image ready
if (underlyingImgEl) {
  underlyingImgEl.style.visibility = 'hidden';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    var im = new Image();
    im.onload = () => resolve(im);
    im.onerror = reject;
    im.decoding = 'async';
    im.src = src;
  });
}

(async function ensureOrder() {
  try {
    // 1) Load and draw overlay (pic0) to the canvas
    const overlay = await loadImage('pic0.png');
    bridgeCanvas.clearRect(0, 0, bridge.width, bridge.height);
    bridgeCanvas.globalCompositeOperation = 'source-over';
    bridgeCanvas.drawImage(overlay, 0, 0, bridge.width, bridge.height);

    // 2) Load the underlying image (pic1) then reveal it
    const underlying = await loadImage('pic1.png');
    if (underlyingImgEl) {
      underlyingImgEl.src = underlying.src;
      underlyingImgEl.style.visibility = 'visible';
    }
  } catch (e) {
    console.log('Image preload failed:', e);
  }
})();


// Új: zene lejátszása helyben (adjusted for mobile policies)
var music = new Audio('music.mp3');  // Helyi mp3 fájl
music.loop = true;
var hasStartedMusic = false;

// STRICT mobile policy: call play() synchronously in user gesture
function tryUnlockAudioSync() {
  if (hasStartedMusic) return;
  var p = music.play();
  if (p && typeof p.then === 'function') {
    p.then(() => { hasStartedMusic = true; })
     .catch((e) => {
       // If blocked, leave hasStartedMusic false; a fallback button can be used
       // console.log('Playback blocked:', e);
     });
  } else {
    hasStartedMusic = true;
  }
}

function startMusicOnScratch() {
  // Kept for compatibility with your original call site,
  // but tryUnlockAudioSync() should be called first in the event handler.
  if (!hasStartedMusic) {
    var p = music.play();
    if (p && p.catch) p.catch(() => {});
    hasStartedMusic = true;
  }
}

// Optional: small visible fallback button if strict browsers still block
(function ensurePlayButton() {
  var btnId = 'playMusic';
  if (!document.getElementById(btnId)) {
    var btn = document.createElement('button');
    btn.id = btnId;
    btn.textContent = 'Play music';
    btn.style.position = 'fixed';
    btn.style.bottom = '1rem';
    btn.style.right = '1rem';
    btn.style.zIndex = '9999';
    btn.style.padding = '0.6rem 1rem';
    btn.style.borderRadius = '8px';
    btn.style.border = 'none';
    btn.style.background = '#7a5e58';
    btn.style.color = '#fff';
    btn.style.fontWeight = '600';
    btn.style.cursor = 'pointer';
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      var p = music.play();
      if (p && p.then) {
        p.then(function () {
          hasStartedMusic = true;
          btn.style.display = 'none';
        }).catch(function () {
          // Keep button visible to let user try again
        });
      }
    }, { passive: true });
  }
})();

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
  // Keep your original flow
  if (!hasStartedMusic) {
    // Call was here before; keep it
    startMusicOnScratch();
  }
  bridgeCanvas.globalCompositeOperation = "destination-out";
  bridgeCanvas.beginPath();
  bridgeCanvas.arc(mouseX, mouseY, brushRadius, 0, 2 * Math.PI, true);
  bridgeCanvas.fill();
  bridgeCanvas.globalCompositeOperation = "source-over";
}

// Prefer pointer events if available for cross-browser consistency
var supportsPointer = 'onpointerdown' in window;

if (supportsPointer) {
  bridge.addEventListener("pointerdown", function (e) {
    // CRITICAL: call play() first in the same event handler for iOS Safari/Chrome
    tryUnlockAudioSync();

    var brushPos = getBrushPos(e.clientX, e.clientY);
    drawDot(brushPos.x, brushPos.y);
  }, { passive: true });

  bridge.addEventListener("pointermove", function (e) {
    if (e.pressure > 0 || (e.buttons & 1) === 1) {
      var brushPos = getBrushPos(e.clientX, e.clientY);
      drawDot(brushPos.x, brushPos.y);
    }
  }, { passive: true });
} else {
  // Original mouse listeners (kept)
  bridge.addEventListener("mousemove", function (e) {
    var brushPos = getBrushPos(e.clientX, e.clientY);
    var leftBut = detectLeftButton(e);
    if (leftBut === true || leftBut === 1) {
      drawDot(brushPos.x, brushPos.y);
    }
  }, false);

  // Add mousedown to unlock audio on desktop without pointer events
  bridge.addEventListener("mousedown", function (e) {
    tryUnlockAudioSync();
    var brushPos = getBrushPos(e.clientX, e.clientY);
    drawDot(brushPos.x, brushPos.y);
  }, { passive: true });

  // Original touchmove (kept) + touchstart to unlock
  bridge.addEventListener("touchstart", function (e) {
    tryUnlockAudioSync();
    var t = e.targetTouches[0];
    if (t) {
      var brushPos = getBrushPos(t.pageX, t.pageY);
      drawDot(brushPos.x, brushPos.y);
    }
  }, { passive: true });

  bridge.addEventListener("touchmove", function (e) {
    e.preventDefault();
    var touch = e.targetTouches[0];
    if (touch) {
      var brushPos = getBrushPos(touch.pageX, touch.pageY);
      drawDot(brushPos.x, brushPos.y);
    }
  }, false);
}