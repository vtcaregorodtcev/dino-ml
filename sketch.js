let iteration = 0;
let DinoStateEnum = { run: 0, jump: 1, fall: 2 };
let cactuses = [];
let dinos = [];
let maxDinoVelocity = 10;
let initDinoVelocity = 5;
let dinoVelocitySlider;

class Cactus {
  constructor(distance) {
    this.currDistance = distance;

    this.passDinoPosition = false;
  }

  onTick(cb = () => { }) {
    cb(this);
  }
}

class Dino {
  constructor(brain = new NeuralNetwork(4, 8, 2)) {
    this.jumpSpeed = 8;

    this.maxH = 104;
    this.currH = 0;

    // this.velocity = 6;

    this.state = DinoStateEnum.run;
    this.score = 0;
    this.fitness = 0;

    this.isDead = false;

    this.brain = brain;
  }

  upScore() {
    this.score++;
  }

  dead() {
    this.isDead = true;
    this.currH = 0;

    this.state = DinoStateEnum.run;
  }

  think({ nearestCactusPositionInput, isEnoughPlaceAfterCactusInput, velocityInput }) {
    const currHInput = this.currH / this.maxH; // normalized position on Y

    const res = this.brain.predict([currHInput, velocityInput, nearestCactusPositionInput, isEnoughPlaceAfterCactusInput])

    return res[0] > res[1];
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

  dinoVelocitySlider = createSlider(0, maxDinoVelocity, initDinoVelocity, 1);

  // --- items ---
  initialDinoW = 120;
  initialDinoH = 156;

  dinoH = 60;
  dinoW = 40;

  cactusH = 30;
  cactusW = 20;

  initCactusD = 700;
  initCactusH = initialDinoH + cactusH;

  // init population
  for (let i = 0; i < TOTAL; i++) {
    dinos.push(new Dino())
  }
}

function drawDino(dino) {
  if (dino.isDead) return;

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

function updateDinoScore() {
  dinos.map(dino => !dino.isDead ? dino.upScore() : null);
}

function drawCactus(cactus) {
  image(cactusImg, cactus.currDistance, initCactusH, cactusW, cactusH)
}

function updateCactuses() {
  const copy = cactuses.slice();

  for (let i = 0; i < copy.length; i++) {
    let c = copy[i];

    c.onTick(cactus => {
      drawCactus(cactus, i)

      cactus.currDistance -= dinoVelocitySlider.value();

      if (cactus.currDistance + cactusW < initialDinoW && !cactus.passDinoPosition) {
        updateDinoScore()

        cactus.passDinoPosition = true;
      }

      if (cactus.currDistance < 0) {
        cactuses.splice(i, 1);
      }
    })
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

function updateScoreLabel() {
  textSize(18);
  textAlign(LEFT);
  fill(0);
  text(`Population: ${dinos.filter(x => !x.isDead).length}`, width * 0.75, 30);
  text(`Generation: ${currentGeneration}`, width * 0.75, 50);
  text(`Best score: ${dinos.sort((a, b) => b.score - a.score)[0].score}`, width * 0.75, 80);
}

function getInfoForDino() {
  const nearestCactus = cactuses.filter(c => !c.passDinoPosition)[0]

  const nearestCactusPositionInput = nearestCactus ? (nearestCactus.currDistance + cactusW / 3) / width : 1; // normalized

  // check 2x place for dino after nearest cactus
  const rangeToTakeInMind = nearestCactus ? [nearestCactus.currDistance + cactusW, nearestCactus.currDistance + cactusW + dinoW * 2] : [width, width];

  const isEnoughPlaceAfterCactusInput = !cactuses.filter(c => c.currDistance >= rangeToTakeInMind[0] && c.currDistance <= rangeToTakeInMind[1]).length

  const velocityInput = dinoVelocitySlider.value() / maxDinoVelocity; // normalized velocity

  return { nearestCactusPositionInput, isEnoughPlaceAfterCactusInput, velocityInput };
}

function updateGenerationIfNeeded() {
  if (dinos.every(d => d.isDead)) {
    cactuses = [];
    dinoVelocitySlider.value(initDinoVelocity);

    dinos = newGeneration(dinos)
  }
}

function speedUpIfNeeded(iteration) {
  const val = dinoVelocitySlider.value();

  if (val == 10) return;

  if (iteration % 1000 == 0) {
    dinoVelocitySlider.value(val + 1)
  }
}

function draw() {
  iteration++;

  speedUpIfNeeded(iteration);

  background(bg);

  generateCactus();

  updateCactuses();

  const dinoInfo = getInfoForDino();

  dinos.map(dino => {
    dino.onTick(dino => {
      drawDino(dino);

      const willJump = dino.think(dinoInfo);

      if (willJump)
        dino.jump()
    });
  });

  dinos.map(dino => {
    if (isDinoHasCollision(dino)) {
      dino.dead();
    }
  })

  updateScoreLabel();

  updateGenerationIfNeeded();
}
