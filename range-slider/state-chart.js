const { createMachine, assign, interpret } = XState;

const handleA = slider.querySelector(".noUi-handle-lower");
const handleB = slider.querySelector(".noUi-handle-upper");
const bar = slider.querySelector(".noUi-connect.noUi-draggable");

const rangeSliderMachine = createMachine(
  {
    id: "rangeSlider",
    type: "parallel",
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
                    target: "#rangeSlider.handleA.moving.progressing",
                    cond: "progressA",
                  },
                },
              },
              max: {
                on: {
                  mousemove: {
                    target: "#rangeSlider.handleA.moving.regressing",
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
                    target: "#rangeSlider.handleB.moving.progressing",
                    cond: "progressB",
                  },
                },
              },
              max: {
                on: {
                  mousemove: {
                    target: "#rangeSlider.handleB.moving.regressing",
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
                    target: "#rangeSlider.bar.moving.progressing",
                    cond: "progressA", // This condition is enough.
                  },
                },
              },
              max: {
                on: {
                  mousemove: {
                    target: "#rangeSlider.bar.moving.regressing",
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
  {
    guards: {
      onA: (context, event) => handleA.matches(":hover"),
      onB: (context, event) => handleB.matches(":hover"),
      onBar: (context, event) => bar.matches(":hover"),
      progressA: (context, event) =>
        parseFloat(slider.noUiSlider.get()[0]) > context.valueA,
      regressA: (context, event) =>
        parseFloat(slider.noUiSlider.get()[0]) < context.valueA,
      progressB: (context, event) =>
        parseFloat(slider.noUiSlider.get()[1]) > context.valueB,
      regressB: (context, event) =>
        parseFloat(slider.noUiSlider.get()[1]) < context.valueB,
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
        valueA: (context, event) => parseFloat(slider.noUiSlider.get()[0]),
        valueB: (context, event) => parseFloat(slider.noUiSlider.get()[1]),
      }),
    },
  }
);

const initialContext = {
  valueA: parseFloat(slider.noUiSlider.get()[0]),
  valueB: parseFloat(slider.noUiSlider.get()[1]),
  minValue: slider.noUiSlider.options.range.min,
  maxValue: slider.noUiSlider.options.range.max,
};

const rangeSliderMachineWithContext = rangeSliderMachine.withContext(
  initialContext
);

const rangeSliderService = interpret(
  rangeSliderMachineWithContext
).onTransition((state) => {
  const states = state.toStrings();
  // console.log(`\t${states[states.length - 1]}\t\t\t${state.event.type}`);
  let stateA = "",
    stateB = "",
    stateBar = "";
  for (const s of states) {
    if (s.startsWith("handleA")) {
      stateA = s;
    } else if (s.startsWith("handleB")) {
      stateB = s;
    } else if (s.startsWith("bar")) {
      stateBar = s;
    }
  }
  console.log(`${stateA}\t\t${stateB}\t\t${stateBar}`);
});

// Event listeners on handleA.
handleA.addEventListener("mousedown", (event) => {
  rangeSliderService.send("mousedownA");
});

handleA.addEventListener("mouseenter", (event) => {
  rangeSliderService.send("mouseenterA");
});

handleA.addEventListener("mouseleave", (event) => {
  rangeSliderService.send("mouseleaveA");
});

// Event listeners on handleB.
handleB.addEventListener("mousedown", (event) => {
  rangeSliderService.send("mousedownB");
});

handleB.addEventListener("mouseenter", (event) => {
  rangeSliderService.send("mouseenterB");
});

handleB.addEventListener("mouseleave", (event) => {
  rangeSliderService.send("mouseleaveB");
});

// Event listeners on bar.
bar.addEventListener("mousedown", (event) => {
  rangeSliderService.send("mousedownBar");
});

bar.addEventListener("mouseenter", (event) => {
  rangeSliderService.send("mouseenterBar");
});

bar.addEventListener("mouseleave", (event) => {
  rangeSliderService.send("mouseleaveBar");
});

// Event listeners on document.
document.addEventListener("mouseup", (event) => {
  rangeSliderService.send(event);
});

document.addEventListener("mousemove", (event) => {
  rangeSliderService.send(event);
});

rangeSliderService.start();
