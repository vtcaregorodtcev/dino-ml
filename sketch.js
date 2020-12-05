let iteration = 0;
let DinoStateEnum = { run: 0, jump: 1, fall: 2 };
let cactuses = [];

class Cactus {
  constructor(distance) {
    this.currDistance = distance;
  }

  onTick(cb = () => { }) {
    cb(this);
  }
}

class Dino {
  constructor() {
    this.jumpSpeed = 8;

    this.maxH = 104;
    this.currH = 0;

    this.velocity = 6;

    this.state = DinoStateEnum.run;
  }

  jump() {
    if (this.state != DinoStateEnum.run) return;

    this.state = DinoStateEnum.jump;
  }

  jumpStuff() {
    switch (this.state) {
      case DinoStateEnum.run: break;
      case DinoStateEnum.jump: {
        this.currH += this.jumpSpeed;

        if (this.currH == this.maxH) {
          this.state = DinoStateEnum.fall;
        }

        break;
      }
      case DinoStateEnum.fall: {
        this.currH -= this.jumpSpeed;

        if (this.currH == 0) {
          this.state = DinoStateEnum.run;
        }

        break;
      }
    }
  }

  onTick(cb = () => { }) {
    this.jumpStuff();

    cb(this);
  }
}

function keyPressed() {
  loop();

  if (key == ' ') {
    dino.jump()
  }
}

function setup() {
  // --- images ---
  bg = loadImage('assets/bg.png');
  dino1 = loadImage('assets/dino_1.png');
  dino2 = loadImage('assets/dino_2.png');
  cactusImg = loadImage('assets/cactus.png');

  createCanvas(720, 240);

  // --- items ---
  initialDinoW = 120;
  initialDinoH = 156;

  dinoH = 60;
  dinoW = 40;

  cactusH = 30;
  cactusW = 20;

  initCactusD = 700;
  initCactusH = initialDinoH + cactusH;

  dino = new Dino();
}

function drawDino(dino) {
  if (dino.state != DinoStateEnum.run) {
    image(dino2, initialDinoW, initialDinoH - dino.currH, 40, 60);
  } else if (iteration % 7 == 0)
    image(dino1, initialDinoW, initialDinoH, dinoW, dinoH);
  else
    image(dino2, initialDinoW, initialDinoH, dinoW, dinoH);
}

function isGoodDistanceToGenerateCactus(lastCactus) {
  return initCactusD - lastCactus.currDistance > 150 || initCactusD - lastCactus.currDistance < 30
}

function generateCactus(rate = 0.03) {
  const lastCactus = cactuses.slice(-1);

  if (
    (!lastCactus.length || isGoodDistanceToGenerateCactus(lastCactus[0])) &&
    random(1) < rate
  )
    cactuses.push(new Cactus(initCactusD));
}

function drawCactus(cactus, idx) {
  image(cactusImg, cactus.currDistance, initCactusH, cactusW, cactusH)

  cactus.currDistance -= dino.velocity;

  if (cactus.currDistance < 0) {
    cactuses.splice(idx, 1);
  }
}

function updateCactuses() {
  const copy = cactuses.slice();

  for (let i = 0; i < copy.length; i++) {
    let c = copy[i];

    c.onTick(cactus => drawCactus(cactus, i))
  }
}

function rectsIntersected(r1, r2) {
  return !(r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top);
}

function isDinoHasCollision(dino) {
  let dinoRect = {
    left: initialDinoW + dinoW / 3,
    top: initialDinoH - dino.currH,
    right: initialDinoW + dinoW / 3 + dinoW / 3,
    bottom: initialDinoH + dinoH - dino.currH
  }

  return cactuses.some(cactus => rectsIntersected(dinoRect, {
    left: cactus.currDistance + cactusW / 3,
    top: initCactusH,
    right: cactus.currDistance + cactusW,
    bottom: initCactusH + cactusH
  }))
}

function draw() {
  iteration++;

  background(bg);

  generateCactus();

  updateCactuses();

  dino.onTick(dino => drawDino(dino));

  if (isDinoHasCollision(dino)) noLoop()
}
