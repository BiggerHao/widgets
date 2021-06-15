import { interpret } from "xstate";
import { join } from "path";
import { createWriteStream, readFileSync } from "fs";

export default class StateTransitionGenerator {
  constructor(machine) {
    this.machine = machine;
  }

  generateStateTransitions(eventsFilePath, outputFilePath) {
    const service = interpret(this.machine);
    const events = readEvents(join(__dirname, eventsFilePath));

    const outputFile = createWriteStream(join(__dirname, outputFilePath));

    service.onTransition((state) => {
      outputFile.write(`${JSON.stringify(state.value)}\n`);
    });
    service.start();

    for (const event of events) {
      service.send(event);
    }

    outputFile.end();
  }
}

function readEvents(eventsFilePath) {
  const content = readFileSync(eventsFilePath);
  const events = JSON.parse(content);
  return events;
}
