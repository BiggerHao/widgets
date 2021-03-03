const { createMachine, assign, interpret } = XState;

const map = document.getElementById("map");

const panningMachine = createMachine({
  id: "pan",
  initial: "outsideWidget",
  states: {
    outsideWidget: {
      on: {
        mouseenter: "onWidget",
      },
    },
    onWidget: {
      initial: "moving",
      states: {
        idle: {
          on: {
            mousemove: "moving",
            mousedown: {
              target: "startingPanning",
            },
          },
        },
        moving: {
          on: {
            mouseleave: "#pan.outsideWidget",
            mousedown: {
              target: "startingPanning",
            },
            mousemove: "moving",
          },
          after: {
            300: "idle",
          },
        },
        startingPanning: {
          on: {
            mousemove: "panningInsideWidget",
            mouseup: "idle",
          },
        },
        panningInsideWidget: {
          on: {
            mouseup: {
              target: "idle",
            },
            mouseleave: "panningOutsideWidget",
            mousemove: "panningInsideWidget",
          },
        },
        panningOutsideWidget: {
          on: {
            mouseup: {
              target: "#pan.outsideWidget",
            },
            mouseenter: "panningInsideWidget",
            mousemove: "panningOutsideWidget",
          },
        },
      },
    },
  },
});

const panningService = interpret(panningMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

map.addEventListener("mousedown", (event) => {
  panningService.send(event);
});

document.addEventListener("mouseup", (event) => {
  panningService.send(event);
});

document.addEventListener("mousemove", (event) => {
  panningService.send(event);
});

map.addEventListener("mouseenter", (event) => {
  panningService.send(event);
});

map.addEventListener("mouseleave", (event) => {
  panningService.send(event);
});

panningService.start();
