export function createRangeSliderMachine(crossfilterId, rangeSliderId) {
  return {
    initial: "temporary",
    states: {
      temporary: {
        always: [
          {
            target: "hasBrush",
            cond: { type: "brushExists", target: rangeSliderId },
          },
          { target: "noBrush" },
        ],
      },
      noBrush: {
        initial: "idle",
        states: {
          idle: {
            on: {
              mousedown: {
                target: "readyToAddBrush",
                cond: { type: "targetMatches", target: "chart" },
              },
            },
          },
          readyToAddBrush: {
            on: {
              mousemove: {
                target: "addingBrush",
                actions: ["setBrushExists", "resetTemporaryState"],
              },
              mouseup: [
                {
                  target: `#${crossfilterId}.active.${rangeSliderId}.hasBrush`,
                  cond: "activeBrushExists",
                },
                { target: "idle" },
              ],
            },
          },
          addingBrush: {
            entry: "updateValues",
            on: {
              mousemove: { target: "addingBrush", internal: false },
              mouseup: generateMouseupTransitions(crossfilterId, rangeSliderId),
              mouseenter: { actions: "setTemporaryState" },
              mouseleave: { actions: "setTemporaryState" },
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
          mousedown: {
            target: "noBrush.readyToAddBrush",
            cond: { type: "targetMatches", target: "chart" },
          },
        },
        states: {
          handleA: {
            initial: "idle",
            states: {
              idle: {
                on: {
                  mousedown: {
                    target: "startMoving",
                    cond: { type: "targetMatches", target: "A" },
                    actions: "resetTemporaryState",
                  },
                },
                always: [
                  { target: "extreme.min", cond: "minA" },
                  { target: "extreme.max", cond: "maxA" },
                ],
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mousedown: {
                    target: "startMoving",
                    cond: { type: "targetMatches", target: "A" },
                    actions: "resetTemporaryState",
                  },
                  mousedown: {
                    target: "updating",
                    cond: { type: "targetMatches", target: "bar" },
                  },
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
                  mousedown: {
                    target: "startMoving",
                    cond: { type: "targetMatches", target: "B" },
                    actions: "resetTemporaryState",
                  },
                },
                always: [
                  { target: "extreme.min", cond: "minB" },
                  { target: "extreme.max", cond: "maxB" },
                ],
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mousedown: [
                    {
                      target: "startMoving",
                      cond: { type: "targetMatches", target: "B" },
                      actions: "resetTemporaryState",
                    },
                    {
                      target: "updating",
                      cond: { type: "targetMatches", target: "bar" },
                    },
                  ],
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
                  mousedown: {
                    target: "startMoving",
                    cond: { type: "targetMatches", target: "bar" },
                    actions: "resetTemporaryState",
                  },
                },
                always: [
                  { target: "minMax", cond: "minMaxBar" },
                  { target: "extreme.min", cond: "minBar" },
                  { target: "extreme.max", cond: "maxBar" },
                ],
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mouseup: generateMouseupTransitions(
                    crossfilterId,
                    rangeSliderId
                  ),
                  mouseenter: { actions: "setTemporaryState" },
                  mouseleave: { actions: "setTemporaryState" },
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
                  mousedown: [
                    {
                      target: "startMoving",
                      cond: { type: "targetMatches", target: "bar" },
                      actions: "resetTemporaryState",
                    },
                    {
                      target: "updating",
                      cond: { type: "targetMatches", target: "A" },
                    },
                    {
                      target: "updating",
                      cond: { type: "targetMatches", target: "B" },
                    },
                  ],
                },
                states: {
                  min: {},
                  max: {},
                },
              },
              minMax: {
                on: {
                  mousedown: [
                    {
                      target: "updating",
                      cond: { type: "targetMatches", target: "A" },
                    },
                    {
                      target: "updating",
                      cond: { type: "targetMatches", target: "B" },
                    },
                  ],
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

export function generateMouseenterTransitions(rangeSliderId) {
  return {
    target: `active.${rangeSliderId}`,
    cond: { type: "targetMatches", target: rangeSliderId },
  };
}

const stateNames = [
  "distance",
  "arrTime",
  "depTime",
  "depDelay",
  "arrDelay",
  "airTime",
];

function generateMouseupTransitions(crossfilterId, rangeSliderId) {
  let transitions = [
    {
      target: `#${crossfilterId}.inactive`,
      cond: { type: "temporaryStateMatches", target: "inactive" },
    },
  ];

  for (const stateName of stateNames) {
    if (stateName != rangeSliderId) {
      transitions.push({
        target: `#${crossfilterId}.active.${stateName}`,
        cond: { type: "temporaryStateMatches", target: stateName },
        actions: "setTemporaryStateAsActiveView",
      });
    }
  }

  transitions.push({
    target: `#${crossfilterId}.active.${rangeSliderId}`,
  });

  return transitions;
}
