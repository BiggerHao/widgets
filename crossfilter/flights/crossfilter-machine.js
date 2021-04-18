import { createMachine, assign } from "xstate";

function hovering(element) {
  return element.matches(":hover");
}

export const rangeSliderMachine = createMachine(
  {
    id: "rangeSlider",
    initial: "inactive",
    states: {
      inactive: {
        on: {
          mouseenterWidget: [
            { target: "active.hasBrush", cond: "brushExists" },
            { target: "active.noBrush" },
          ],
        },
      },
      active: {
        on: {
          mouseleaveWidget: "inactive",
        },
        states: {
          noBrush: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  mousedownChart: "addingBrush",
                },
              },
              addingBrush: {
                entry: "updateValues",
                on: {
                  mousemove: { target: "addingBrush", internal: false },
                  mouseup: "#rangeSlider.active.hasBrush",
                },
              },
            },
          },
          hasBrush: {
            type: "parallel",
            on: {
              clickReset: "noBrush",
            },
            states: {
              handleA: {
                initial: "idle",
                states: {
                  idle: {
                    on: {
                      mouseenterA: "hovering",
                    },
                    always: [
                      { target: "hovering", cond: "onA" },
                      { target: "extreme.min", cond: "minA" },
                      { target: "extreme.max", cond: "maxA" },
                    ],
                  },
                  hovering: {
                    on: {
                      mousedownA: "startMoving",
                      mouseleaveA: "idle",
                    },
                  },
                  startMoving: {
                    on: {
                      mousemove: [
                        {
                          target: "moving.progressing",
                          cond: "progressA",
                        },
                        {
                          target: "moving.regressing",
                          cond: "regressA",
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      { target: "movingExtreme.min", cond: "minA" },
                      { target: "movingExtreme.max", cond: "maxA" },
                    ],
                  },
                  moving: {
                    entry: "updateValues",
                    on: {
                      mousemove: [
                        {
                          target: ".progressing",
                          cond: "progressA",
                          internal: false,
                        },
                        {
                          target: ".regressing",
                          cond: "regressA",
                          internal: false,
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      {
                        target: "movingExtreme.min",
                        cond: "minA",
                      },
                      {
                        target: "movingExtreme.max",
                        cond: "maxA",
                      },
                    ],
                    states: {
                      progressing: {},
                      regressing: {},
                    },
                  },
                  movingExtreme: {
                    on: {
                      mouseup: "idle",
                    },
                    states: {
                      min: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.handleA.moving.progressing",
                            cond: "progressA",
                          },
                        },
                      },
                      max: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.handleA.moving.regressing",
                            cond: "regressA",
                          },
                        },
                      },
                    },
                  },
                  extreme: {
                    on: {
                      mouseenterA: "hovering",
                      mousedownBar: "updating",
                    },
                    states: {
                      min: {},
                      max: {},
                    },
                  },
                  updating: {
                    on: {
                      mouseup: "idle",
                    },
                  },
                },
              },
              handleB: {
                initial: "idle",
                states: {
                  idle: {
                    on: {
                      mouseenterB: "hovering",
                    },
                    always: [
                      { target: "hovering", cond: "onB" },
                      { target: "extreme.min", cond: "minB" },
                      { target: "extreme.max", cond: "maxB" },
                    ],
                  },
                  hovering: {
                    on: {
                      mousedownB: "startMoving",
                      mouseleaveB: "idle",
                    },
                  },
                  startMoving: {
                    on: {
                      mousemove: [
                        {
                          target: "moving.progressing",
                          cond: "progressB",
                        },
                        {
                          target: "moving.regressing",
                          cond: "regressB",
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      { target: "movingExtreme.min", cond: "minB" },
                      { target: "movingExtreme.max", cond: "maxB" },
                    ],
                  },
                  moving: {
                    entry: "updateValues",
                    on: {
                      mousemove: [
                        {
                          target: ".progressing",
                          cond: "progressB",
                          internal: false,
                        },
                        {
                          target: ".regressing",
                          cond: "regressB",
                          internal: false,
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      {
                        target: "movingExtreme.min",
                        cond: "minB",
                      },
                      {
                        target: "movingExtreme.max",
                        cond: "maxB",
                      },
                    ],
                    states: {
                      progressing: {},
                      regressing: {},
                    },
                  },
                  movingExtreme: {
                    on: {
                      mouseup: "idle",
                    },
                    states: {
                      min: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.handleB.moving.progressing",
                            cond: "progressB",
                          },
                        },
                      },
                      max: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.handleB.moving.regressing",
                            cond: "regressB",
                          },
                        },
                      },
                    },
                  },
                  extreme: {
                    on: {
                      mouseenterB: "hovering",
                      mousedownBar: "updating",
                    },
                    states: {
                      min: {},
                      max: {},
                    },
                  },
                  updating: {
                    on: {
                      mouseup: "idle",
                    },
                  },
                },
              },
              bar: {
                initial: "idle",
                states: {
                  idle: {
                    on: {
                      mouseenterBar: "hovering",
                    },
                    always: [
                      { target: "hovering", cond: "onBar" },
                      { target: "minMax", cond: "minMaxBar" },
                      { target: "extreme.min", cond: "minBar" },
                      { target: "extreme.max", cond: "maxBar" },
                    ],
                  },
                  hovering: {
                    on: {
                      mousedownBar: "startMoving",
                      mouseleaveBar: "idle",
                    },
                  },
                  startMoving: {
                    on: {
                      mousemove: [
                        {
                          target: "moving.progressing",
                          cond: "progressA", // This condition is enough.
                        },
                        {
                          target: "moving.regressing",
                          cond: "regressA", // This condition is enough.
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      { target: "movingExtreme.min", cond: "minBar" },
                      { target: "movingExtreme.max", cond: "maxBar" },
                    ],
                  },
                  moving: {
                    entry: "updateValues",
                    on: {
                      mousemove: [
                        {
                          target: ".progressing",
                          cond: "progressA", // This condition is enough.
                          internal: false,
                        },
                        {
                          target: ".regressing",
                          cond: "regressA", // This condition is enough.
                          internal: false,
                        },
                      ],
                      mouseup: "idle",
                    },
                    always: [
                      {
                        target: "movingExtreme.min",
                        cond: "minBar",
                      },
                      {
                        target: "movingExtreme.max",
                        cond: "maxBar",
                      },
                    ],
                    states: {
                      progressing: {},
                      regressing: {},
                    },
                  },
                  movingExtreme: {
                    on: {
                      mouseup: "idle",
                    },
                    states: {
                      min: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.bar.moving.progressing",
                            cond: "progressA", // This condition is enough.
                          },
                        },
                      },
                      max: {
                        on: {
                          mousemove: {
                            target:
                              "#rangeSlider.active.hasBrush.bar.moving.regressing",
                            cond: "regressA", // This condition is enough.
                          },
                        },
                      },
                    },
                  },
                  extreme: {
                    on: {
                      mouseenterBar: "hovering",
                      mousedownA: "updating",
                      mousedownB: "updating",
                    },
                    states: {
                      min: {},
                      max: {},
                    },
                  },
                  minMax: {
                    on: {
                      mousedownA: "updating",
                      mousedownB: "updating",
                    },
                  },
                  updating: {
                    on: {
                      mouseup: "idle",
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  {
    guards: {
      brushExists: (context, event) => context.brushExists,
      onA: (context, event) => context.handleA.some(hovering),
      onB: (context, event) => context.handleB.some(hovering),
      onBar: (context, event) => context.bar.matches(":hover"),
      progressA: (context, event) =>
        context.view.signal("brush")[0] > context.valueA,
      regressA: (context, event) =>
        context.view.signal("brush")[0] < context.valueA,
      progressB: (context, event) =>
        context.view.signal("brush")[1] > context.valueB,
      regressB: (context, event) =>
        context.view.signal("brush")[1] < context.valueB,
      minA: (context, event) => context.valueA == context.minValue,
      maxA: (context, event) => context.valueA == context.maxValue,
      minB: (context, event) => context.valueB == context.minValue,
      maxB: (context, event) => context.valueB == context.maxValue,
      minBar: (context, event) =>
        context.valueA == context.minValue ||
        context.valueB == context.minValue,
      maxBar: (context, event) =>
        context.valueA == context.maxValue ||
        context.valueB == context.maxValue,
      minMaxBar: (context, event) =>
        (context.valueA == context.minValue &&
          context.valueB == context.maxValue) ||
        (context.valueA == context.maxValue &&
          context.valueB == context.minValue),
    },
    actions: {
      updateValues: assign({
        valueA: (context, event) => context.view.signal("brush")[0],
        valueB: (context, event) => context.view.signal("brush")[1],
      }),
      printValues: (context, event) => {
        console.log(context.valueA, context.valueB);
      },
    },
  }
);
