export function createRangeSliderMachine(crossfilterId, rangeSliderId) {
  return {
    states: {
      noBrush: {
        initial: "idle",
        states: {
          idle: {
            on: {
              mousedownChart: "readyToAddBrush",
            },
          },
          readyToAddBrush: {
            on: {
              mousemove: { target: "addingBrush", actions: "setBrushExists" },
              mouseup: "idle",
            },
          },
          addingBrush: {
            entry: "updateValues",
            on: {
              mousemove: { target: "addingBrush", internal: false },
              mouseup: `#${crossfilterId}.active.${rangeSliderId}.hasBrush`,
            },
          },
        },
      },
      hasBrush: {
        type: "parallel",
        on: {
          clickReset: {
            target: "noBrush",
            actions: ["resetBrushExists", "resetValues"],
          },
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
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.handleA.moving.progressing`,
                        cond: "progressA",
                      },
                    },
                  },
                  max: {
                    on: {
                      mousemove: {
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.handleA.moving.regressing`,
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
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.handleB.moving.progressing`,
                        cond: "progressB",
                      },
                    },
                  },
                  max: {
                    on: {
                      mousemove: {
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.handleB.moving.regressing`,
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
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.bar.moving.progressing`,
                        cond: "progressA", // This condition is enough.
                      },
                    },
                  },
                  max: {
                    on: {
                      mousemove: {
                        target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush.bar.moving.regressing`,
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
  };
}
