class NeuralNetwork {
  constructor(inputs, hiddenUnits, outputs, model = {}) {
    this.input_nodes = inputs;
    this.hidden_nodes = hiddenUnits;
    this.output_nodes = outputs;

    if (model instanceof tf.Sequential) {
      this.model = model;
    } else {
      this.model = this.createModel();
    }
  }

  copy() {
    return tf.tidy(() => {
      const modelCopy = this.createModel();
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      modelCopy.setWeights(weightCopies);
      return new NeuralNetwork(this.input_nodes, this.hidden_nodes, this.output_nodes, modelCopy);
    });
  }

  mutate(rate) {
    tf.tidy(() => {
      const weights = this.model.getWeights();
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        let tensor = weights[i];
        let shape = weights[i].shape;
        let values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (Math.random() < rate) {
            let w = values[j];
            values[j] = w + this.gaussianRandom();
          }
        }
        let newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
    });
  }

  gaussianRand() {
    var rand = 0;

    for (var i = 0; i < 6; i += 1) {
      rand += Math.random();
    }

    return rand / 6;
  }

  gaussianRandom(start = -1, end = 1) {
    return Math.floor(start + this.gaussianRand() * (end - start + 1));
  }

  dispose() {
    this.model.dispose();
  }

  predict(inputs) {
    return tf.tidy(() => {
      const xs = tf.tensor([inputs]);
      const ys = this.model.predict(xs);
      const output = ys.dataSync();
      return output;
    });
  }

  createModel() {
    const model = tf.sequential();
    const hiddenLayer = tf.layers.dense({
      units: this.hidden_nodes,
      inputShape: [this.input_nodes],
      activation: "sigmoid"
    });
    model.add(hiddenLayer);
    const outputLayer = tf.layers.dense({
      units: this.output_nodes,
      activation: "sigmoid"
    });
    model.add(outputLayer);
    return model;
  }
}
