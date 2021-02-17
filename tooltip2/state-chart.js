const { createMachine, assign, interpret } = XState;

const button = document.getElementById("button");
const tooltip = document.getElementById("tooltip");

const tooltipMachine = createMachine(
  {
    id: "tooltip",
    initial: "outsideWidget",
    context: {
      clientX: 0,
      clientY: 0,
    },
    states: {
      onWidget: {
        initial: "tooltipInvisible",
        on: {
          mouseleave: "outsideWidget",
        },
        states: {
          tooltipInvisible: {
            on: {
              mousemove: {
                target: "tooltipInvisible",
                actions: assign({
                  clientX: (context, event) => event.clientX,
                  clientY: (context, event) => event.clientY,
                }),
              },
            },
            after: {
              200: "tooltipVisible",
            },
          },
          tooltipVisible: {
            entry: "showTooltip",
            on: {
              mousemove: {
                target: "tooltipInvisible",
                actions: "hideTooltip",
              },
            },
          },
        },
      },
      outsideWidget: {
        entry: "hideTooltip",
        on: {
          mouseenter: "onWidget",
        },
      },
    },
  },
  {
    actions: {
      showTooltip: (context, event) => {
        tooltip.style.visibility = "visible";
        tooltip.style.top = context.clientY + "px";
        tooltip.style.left = context.clientX + "px";
      },
      hideTooltip: (context, event) => {
        if (event.type != "xstate.init") {
          tooltip.style.visibility = "hidden";
        }
      },
    },
  }
);

const tooltipService = interpret(tooltipMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});

button.addEventListener("mouseenter", (event) => {
  tooltipService.send(event);
});

button.addEventListener("mouseleave", (event) => {
  tooltipService.send(event);
});

button.addEventListener("mousemove", (event) => {
  tooltipService.send(event);
});

tooltipService.start();
