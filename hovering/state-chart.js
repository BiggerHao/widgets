const { createMachine, interpret } = XState;

const helper = document.getElementById("helper");
const button = document.getElementsByTagName("button")[0];

const hoveringMachine = createMachine({
  id: "hovering",
  initial: "idle",
  states: {
    idle: {
      on: {
        mouseover: "hovering",
      },
    },
    hovering: {
      on: {
        mouseout: "idle",
      },
    },
  },
});

const hoveringService = interpret(hoveringMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

button.addEventListener("mouseover", (event) => {
  hoveringService.send(event);
});

button.addEventListener("mouseout", (event) => {
  hoveringService.send(event);
});


hoveringService.start();
