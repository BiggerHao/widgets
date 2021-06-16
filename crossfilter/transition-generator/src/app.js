import { crossfilterMachine } from "../../flights/crossfilter-machine";
import StateTransitionGenerator from "./StateTransitionGenerator";
import { assign } from "xstate";
import TransitionProbabilityGenerator from "./TransitionProbabilityGenerator";

main();

async function main() {
  const machine = initializeMachine(crossfilterMachine);
  const transitionGenerator = new StateTransitionGenerator(machine);

  transitionGenerator.generateStateTransitions(
    "../data/events/test_events.json",
    "../data/states/test_states.jsonl"
  );

  probabilityGenerator = new TransitionProbabilityGenerator();
  await probabilityGenerator.readTransitionFile(
    "../data/states/test_states.jsonl"
  );
  probabilityGenerator.generateTransitionProbabilities(
    "../data/probabilities/test_probabilities.json"
  );
}

function initializeMachine(machine) {
  const viewNames = [
    "DISTANCE",
    "ARR_TIME",
    "DEP_TIME",
    "DEP_DELAY",
    "ARR_DELAY",
    "AIR_TIME",
  ];
  const brushExists = new Map();
  const valueA = new Map();
  const valueB = new Map();
  const minValue = new Map();
  const maxValue = new Map();

  for (const viewName of viewNames) {
    brushExists.set(viewName, false);
    valueA.set(viewName, 0);
    valueB.set(viewName, 0);
  }
  initializeValueRanges(minValue, maxValue);

  // Since we are generating state transitions without running a crossfilter
  // user interface, the guards and actions of the machine should not rely on
  // the user interface.
  return machine
    .withConfig({
      guards: {
        brushExists: (context, event) =>
          context.brushExists.get(event.viewName),
        activeBrushExists: (context, event) =>
          context.brushExists.get(context.activeViewName),
        onA: (context, event) => event.hoveringObject === "A",
        onB: (context, event) => event.hoveringObject === "B",
        onBar: (context, event) => event.hoveringObject === "Bar",
        progressA: (context, event) => event.progressA,
        regressA: (context, event) => event.regressA,
        progressB: (context, event) => event.progressB,
        regressB: (context, event) => event.regressB,
        minA: (context, event) =>
          context.valueA.get(context.activeViewName) ==
          context.minValue.get(context.activeViewName),
        maxA: (context, event) =>
          context.valueA.get(context.activeViewName) ==
          context.maxValue.get(context.activeViewName),
        minB: (context, event) =>
          context.valueB.get(context.activeViewName) ==
          context.minValue.get(context.activeViewName),
        maxB: (context, event) =>
          context.valueB.get(context.activeViewName) ==
          context.maxValue.get(context.activeViewName),
        minBar: (context, event) => {
          const minValue = context.minValue.get(context.activeViewName);
          return (
            context.valueA.get(context.activeViewName) == minValue ||
            context.valueB.get(context.activeViewName) == minValue
          );
        },
        maxBar: (context, event) => {
          const maxValue = context.maxValue.get(context.activeViewName);
          return (
            context.valueA.get(context.activeViewName) == maxValue ||
            context.valueB.get(context.activeViewName) == maxValue
          );
        },
        minMaxBar: (context, event) => {
          const minValue = context.minValue.get(context.activeViewName);
          const maxValue = context.maxValue.get(context.activeViewName);
          const valueA = context.valueA.get(context.activeViewName);
          const valueB = context.valueB.get(context.activeViewName);
          return (
            (valueA == minValue && valueB == maxValue) ||
            (valueA == maxValue && valueB == minValue)
          );
        },
      },
      actions: {
        setActiveView: assign({
          activeViewName: (context, event) => event.viewName,
        }),
        resetActiveView: assign({
          activeViewName: null,
        }),
        setBrushExists: assign({
          brushExists: (context, event) =>
            context.brushExists.set(context.activeViewName, true),
        }),
        resetBrushExists: assign({
          brushExists: (context, event) =>
            context.brushExists.set(context.activeViewName, false),
        }),
        updateValues: assign({
          valueA: (context, event) =>
            context.valueA.set(context.activeViewName, event.valueA),
          valueB: (context, event) =>
            context.valueB.set(context.activeViewName, event.valueB),
        }),
        resetValues: assign({
          valueA: (context, event) =>
            context.valueA.set(context.activeViewName, 0),
          valueB: (context, event) =>
            context.valueB.set(context.activeViewName, 0),
        }),
      },
    })
    .withContext({
      activeViewName: null,
      brushExists: brushExists,
      valueA: valueA,
      valueB: valueB,
      minValue: minValue,
      maxValue: maxValue,
    });
}

function initializeValueRanges(minValue, maxValue) {
  minValue.set("DISTANCE", 0);
  maxValue.set("DISTANCE", 5000);

  minValue.set("ARR_TIME", 0);
  maxValue.set("ARR_TIME", 24);

  minValue.set("DEP_TIME", 0);
  maxValue.set("DEP_TIME", 24);

  minValue.set("DEP_DELAY", -20);
  maxValue.set("DEP_DELAY", 60);

  minValue.set("ARR_DELAY", -20);
  maxValue.set("ARR_DELAY", 60);

  minValue.set("AIR_TIME", 0);
  maxValue.set("AIR_TIME", 500);
}
