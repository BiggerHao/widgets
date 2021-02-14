const { createMachine, interpret } = XState;

const panningMachine = createMachine({
  // Machine identifier
  id: "pan",

  // Initial state
  initial: "initialized",

  // Local context for entire machine
  context: {},

  // State definitions
  states: {
    initialized: {
      on: {
        ENTER_WIDGET: "onWidget",
        LEAVE_WIDGET: "outsideWidget",
      },
    },
    outsideWidget: {
      on: {
        ENTER_WIDGET: "onWidget.moving",
      },
    },
    onWidget: {
      initial: "rest",
      states: {
        rest: {
          on: {
            MOUSE_MOVE: "moving",
            START_PANNING: "startingPanning",
          },
        },
        moving: {
          on: {
            LEAVE_WIDGET: "#pan.outsideWidget",
            STOP_MOVING: "rest",
            START_PANNING: "startingPanning",
            MOUSE_MOVE: "moving",
          },
        },
        startingPanning: {
          on: {
            PAN: "panningInsideWidget",
          },
        },
        panningInsideWidget: {
          on: {
            STOP_PANNING: "rest",
            LEAVE_WIDGET: "panningOutsideWidget",
            PAN: "panningInsideWidget",
          },
        },
        panningOutsideWidget: {
          on: {
            STOP_PANNING: "#pan.outsideWidget",
            ENTER_WIDGET: "panningInsideWidget",
            PAN: "panningOutsideWidget",
          },
        },
      },
    },
  },
});

// Interpret the machine, and add a listener for whenever a transition occurs.
const panningService = interpret(panningMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

const map = document.getElementById("map");

let timer;
let dragging = false;

function mousemoveHandler() {
  if (!dragging) {
    panningService.send("MOUSE_MOVE");
    clearTimeout(timer);
    timer = setTimeout(() => {
      panningService.send("STOP_MOVING");
    }, 300);
  } else {
    panningService.send("PAN");
  }
}
document.addEventListener("mousemove", mousemoveHandler);

map.addEventListener("mousedown", () => {
  clearTimeout(timer);
  dragging = true;
  panningService.send("START_PANNING");
});

document.addEventListener("mouseup", () => {
  if (dragging) {
    panningService.send("STOP_PANNING");
    dragging = false;
  }
});

map.addEventListener("mouseenter", () => {
  panningService.send("ENTER_WIDGET");
});

map.addEventListener("mouseleave", () => {
  clearTimeout(timer);
  panningService.send("LEAVE_WIDGET");
});

// Start the service
panningService.start();

// Initialize the state chart.
if (map.matches(":hover")) {
  panningService.send("ENTER_WIDGET");
} else {
  panningService.send("LEAVE_WIDGET");
}
