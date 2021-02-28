const { createMachine, interpret } = XState;

const helper = document.getElementById("helper");
const button = document.getElementsByTagName("button")[0];

const clickingMachine = createMachine({
  id: "clicking",
  initial: "idle",
  states: {
    idle: {
      on: {
        mouseenter: "hovering",
      },
    },
    hovering: {
      on: {
        click: "hovering",
        mouseleave: "idle",
      },
    },
  },
});

const clickingService = interpret(clickingMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

button.addEventListener("mouseenter", (event) => {
  clickingService.send(event);
});

button.addEventListener("mouseleave", (event) => {
  clickingService.send(event);
});

button.addEventListener("click", (event) => {
  helper.innerHTML = Date();
  clickingService.send(event);
});

clickingService.start();
