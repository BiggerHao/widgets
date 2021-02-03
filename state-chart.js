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
        ENTER_WIDGET: "onWidget",
      },
    },
    onWidget: {
      initial: "rest",
      states: {
        rest: {
          on: {
            MOUSE_MOVE: "moving",
          },
        },
        moving: {
          on: {
            START_PANNING: "startingPanning",
            LEAVE_WIDGET: "#pan.outsideWidget",
            STOP_ON_WIDGET: "rest",
          },
        },
        startingPanning: {
          on: {
            PAN: "panning",
          },
        },
        panning: {
          on: {
            STOP_PANNING_OUTSIDE_WIDGET: "#pan.outsideWidget",
            STOP_PANNING_INSIDE_WIDGET: "rest"
          },
        },
      },
    },
  },
});

// Interpret the machine, and add a listener for whenever a transition occurs.
const panningService = interpret(panningMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(states[states.length - 1]);
});

const map = document.getElementById("map");

let timer;
function mousemoveHandler() {
  panningService.send("MOUSE_MOVE");
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (map.matches(":hover")) {
      panningService.send("STOP_ON_WIDGET");
    }
  }, 300);
}
myMap.on("mousemove", mousemoveHandler);

myMap.on("movestart", () => {
  myMap.off("mousemove", mousemoveHandler);
  clearTimeout(timer);
  panningService.send("START_PANNING");
});

myMap.on("move", () => {
  panningService.send("PAN");
});

myMap.on("moveend", () => {
  if (map.matches(":hover")) {
    panningService.send("STOP_PANNING_INSIDE_WIDGET");
  } else {
    panningService.send("STOP_PANNING_OUTSIDE_WIDGET");
  }
  myMap.on("mousemove", mousemoveHandler);
});

map.addEventListener("mouseenter", () => {
  panningService.send("ENTER_WIDGET");
});

map.addEventListener("mouseleave", () => {
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
