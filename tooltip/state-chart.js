const { createMachine, interpret } = XState;

const tooltipMachine = createMachine({
  id: "tooltip",
  initial: "initialized",
  context: {},
  states: {
    initialized: {
      on: {
        ENTER_WIDGET: "onWidget",
        LEAVE_WIDGET: "outsideWidget",
      },
    },
    onWidget: {
      initial: "tooltipInvisible",
      on: {
        LEAVE_WIDGET: "outsideWidget",
      },
      states: {
        tooltipInvisible: {
          on: {
            MOUSE_MOVE: "tooltipInvisible",
            STOP_MOVING: "tooltipVisible",
          },
        },
        tooltipVisible: {},
      },
    },
    outsideWidget: {
      on: {
        ENTER_WIDGET: "onWidget",
      },
    },
  },
});

const tooltipService = interpret(tooltipMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});
