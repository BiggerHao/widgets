const { createMachine, assign, interpret } = XState;

const box = document.getElementById("box");

const panningMachine = createMachine(
  {
    id: "pan",
    initial: "initialized",
    context: {
      x: 0,
      y: 0,
      cursorX: 0,
      cursorY: 0,
    },
    states: {
      initialized: {
        always: [
          { target: "onWidget", cond: "hoverOnWidget" },
          { target: "outsideWidget" },
        ],
      },
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
              mousedown: "startingPanning",
            },
          },
          moving: {
            on: {
              mouseleave: "#pan.outsideWidget",
              mousedown: {
                target: "startingPanning",
                actions: assign({
                  cursorX: (context, event) => event.clientX,
                  cursorY: (context, event) => event.clientY,
                }),
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
            },
          },
          panningInsideWidget: {
            entry: "updatePosition",
            on: {
              mouseup: {
                target: "idle",
                actions: assign({
                  x: (context, event) =>
                    context.x + event.clientX - context.cursorX,
                  y: (context, event) =>
                    context.y + event.clientY - context.cursorY,
                }),
              },
              mouseleave: "panningOutsideWidget",
              mousemove: "panningInsideWidget",
            },
          },
          panningOutsideWidget: {
            entry: "updatePosition",
            on: {
              mouseup: {
                target: "#pan.outsideWidget",
                actions: assign({
                  x: (context, event) =>
                    context.x + event.clientX - context.cursorX,
                  y: (context, event) =>
                    context.y + event.clientY - context.cursorY,
                }),
              },
              mouseenter: "panningInsideWidget",
              mousemove: "panningOutsideWidget",
            },
          },
        },
      },
    },
  },
  {
    actions: {
      updatePosition: (context, event) => {
        box.style.left = context.x + event.clientX - context.cursorX + "px";
        box.style.top = context.y + event.clientY - context.cursorY + "px";
      },
    },
    guards: {
      hoverOnWidget: (context, event) => document.body.matches(":hover"),
    },
  }
);

const panningService = interpret(panningMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

document.body.addEventListener("mousedown", (event) => {
  panningService.send(event);
});

document.addEventListener("mouseup", (event) => {
  panningService.send(event);
});

document.addEventListener("mousemove", (event) => {
  panningService.send(event);
});

document.body.addEventListener("mouseenter", (event) => {
  panningService.send(event);
});

document.body.addEventListener("mouseleave", (event) => {
  panningService.send(event);
});

panningService.start();
