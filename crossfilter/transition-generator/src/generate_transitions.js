import StateTransitionGenerator from "./StateTransitionGenerator";
import { crossfilterMachine } from "../../flights/crossfilter-machine";

main();

function main() {
  const machine = initializeMachine(crossfilterMachine);
  const transitionGenerator = new StateTransitionGenerator(machine);

  const pids = [
    "01a259b8-856e-48ae-92bd-fade80fa00c6",
    "0505add0-b02e-4730-8816-c6674a2a9b7b",
    "14278406-2491-438d-b3e0-80fc1fbcd1b3",
    "1d4cdb4f-febf-48f9-b778-8a95e47dd7df",
    "3e47ed06-11e9-412f-87f2-282a9d34679c",
    "5c0c08df-b704-4256-989a-082cbaaec984",
    "70f3f96b-730f-4733-bdb8-5fa2463693f0",
    "8076ab81-511f-456a-afc0-da6d5799b13b",
    "812ddf08-7783-49fb-ad52-350c8b9d4996",
    "a00979ec-95d3-412e-873c-8c01322432df",
  ];
  const dataset = "flights";
  const task = "4";

  for (const pid of pids) {
    console.log(`Processing ${pid}...`);

    const filename = `${pid}_${dataset}_${task}`;
    const event_filename = `../data/events/${pid}/${filename}.json`;
    const state_filename = `../data/states/${pid}/${filename}.jsonl`;

    transitionGenerator.generateStateTransitions(
      event_filename,
      state_filename
    );
  }
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

  return machine.withContext({
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
