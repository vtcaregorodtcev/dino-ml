const TOTAL = 250;
let currentGeneration = 1;

const newGeneration = (dinos) => {
  const newDinos = [];

  calculateFitness(dinos);
  const maxDinos = dinos.sort((a, b) => b.fitness - a.fitness)

  for (let i = 0; i < TOTAL; i++) {
    newDinos.push(pickOne(maxDinos));
  }

  console.log(currentGeneration++);
  return newDinos;
}

const pickOne = (dinos) => {
  let index = 0;
  let r = Math.random();

  while (r > 0) {
    r = r - dinos[index].fitness;
    index++;
  }

  index--;

  let dino = dinos[index]

  const dinoBrain = dino.brain.copy();
  dinoBrain.mutate(0.2)

  let newDino = new Dino(dinoBrain)

  return newDino;
}

const calculateFitness = (dinos) => {
  let sum = 0;

  dinos.map(d => sum += d.score)
  dinos.map(d => d.fitness = d.score / sum)
}
