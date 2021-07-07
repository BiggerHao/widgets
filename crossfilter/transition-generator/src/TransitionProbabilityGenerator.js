import { createReadStream, mkdirSync, writeFileSync } from "fs";

import { createInterface } from "readline";
import { dirname } from "path";
import { join } from "path";

export default class TransitionProbabilityGenerator {
  constructor() {
    this.fromStates = new Map();
    this.transitions = new Map();
  }

  async readTransitionFile(transitionFilePath) {
    const fileStream = createReadStream(join(__dirname, transitionFilePath));

    const rl = createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let lastState = undefined;
    for await (const line of rl) {
      if (lastState) {
        insertOrIncrement(this.fromStates, lastState);
        if (!this.transitions.has(lastState)) {
          this.transitions.set(lastState, new Map());
        }
        insertOrIncrement(this.transitions.get(lastState), line);
      }
      lastState = line;
    }
  }

  generateTransitionProbabilities(outputFilePath) {
    const transitionProbabilities = [];
    for (const [fromState, toStates] of this.transitions) {
      const totalTransitionCount = this.fromStates.get(fromState);
      for (const [toState, count] of toStates) {
        transitionProbabilities.push({
          fromState: parseState(fromState),
          toState: parseState(toState),
          probability: count / totalTransitionCount,
        });
      }
    }

    if (outputFilePath) {
      outputFilePath = join(__dirname, outputFilePath);
      mkdirSync(dirname(outputFilePath), { recursive: true }, (err) => {
        if (err) throw err;
      });
      writeFileSync(outputFilePath, JSON.stringify(transitionProbabilities));
    }
    return transitionProbabilities;
  }
}

function insertOrIncrement(map, key) {
  const oldValue = map.get(key);
  if (oldValue) {
    map.set(key, oldValue + 1);
  } else {
    map.set(key, 1);
  }
}

function parseState(stateString) {
  let state;
  try {
    state = JSON.parse(stateString);
  } catch (err) {
    state = stateString;
  }
  return state;
}
