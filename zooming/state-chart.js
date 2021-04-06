const { createMachine, assign, interpret } = XState;

const map = document.getElementById("map");

const zoomingMachine = createMachine(
  {
    id: "zooming",
    initial: "outsideWidget",
    context: {
      zoomLevel: 6,
      maxZoom: 18,
      minZoom: 1,
    },
    states: {
      outsideWidget: {
        on: {
          mouseenter: "onWidget",
        },
      },
      onWidget: {
        entry: ["updateZoomLevel", 'printZoomLevel'],
        on: {
          mouseleave: "outsideWidget",
          wheel: [
            {
              target: ".zoomingIn",
              cond: "scrollUp",
              // actions: ["updateZoomLevel", 'printZoomLevel'],
              internal: false
            },
            {
              target: ".zoomingOut",
              cond: "scrollDown",
              // actions: "updateZoomLevel",
              internal: false
            },
          ],
        },
        states: {
          zoomingIn: {
            always: { target: "#zooming.max", cond: "isMaxZoom"}
          },
          zoomingOut: {
            entry: "printHello",
          },
        },
      },
      min: {},
      max: {},
    },
  },
  {
    guards: {
      isMinZoom: (context, event) => context.zoomLevel == context.minZoom,
      isMaxZoom: (context, event) => context.zoomLevel == context.maxZoom,
      scrollUp: (context, event) => event.deltaY < 0,
      scrollDown: (context, event) => event.deltaY > 0,
    },
    actions: {
      updateZoomLevel: assign({
        zoomLevel: (context, event) => {console.log('here:', myMap.getZoom()); return myMap.getZoom()},
      }),
      printMessage: (context, event) => {
        console.log("MSG", myMap.getZoom(), context.zoomLevel);
      },
      printZoomLevel: (context, event) => {
        console.log("Current", context.zoomLevel);
      },
      printHello: () => {
        console.log("Hello");
      },
    },
  }
);

const zoomingService = interpret(zoomingMachine).onTransition((state) => {
  const states = state.toStrings();
  console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
});
// .onChange((context) => {
//   console.log(context);
// });

map.addEventListener("mouseenter", (event) => {
  zoomingService.send(event);
});

map.addEventListener("mouseleave", (event) => {
  zoomingService.send(event);
});

map.addEventListener("wheel", (event) => {
  console.log("wheel1");
  zoomingService.send(event);
  console.log("wheel2");
});

myMap.on('zoom', () => {console.log('zoomed')})

zoomingService.start();
