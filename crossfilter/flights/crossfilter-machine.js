import { createMachine, assign } from "xstate";
import {
  createRangeSliderMachine,
  generateMouseenterTransitions,
} from "./range-slider-machine.js";

const crossfilterId = "crossfilter";

export const crossfilterMachine = createMachine(
  {
    id: crossfilterId,
    initial: "inactive",
    states: {
      inactive: {
        entry: "resetActiveView",
        on: {
          mouseenterDistance: generateMouseenterTransitions("distance"),
          mouseenterArrTime: generateMouseenterTransitions("arrTime"),
          mouseenterDepTime: generateMouseenterTransitions("depTime"),
          mouseenterDepDelay: generateMouseenterTransitions("depDelay"),
          mouseenterArrDelay: generateMouseenterTransitions("arrDelay"),
          mouseenterAirTime: generateMouseenterTransitions("airTime"),
        },
      },
      active: {
        entry: "setActiveView",
        on: {
          mouseleaveWidget: "inactive",
        },
        states: {
          distance: createRangeSliderMachine(crossfilterId, "distance"),
          arrTime: createRangeSliderMachine(crossfilterId, "arrTime"),
          depTime: createRangeSliderMachine(crossfilterId, "depTime"),
          depDelay: createRangeSliderMachine(crossfilterId, "depDelay"),
          arrDelay: createRangeSliderMachine(crossfilterId, "arrDelay"),
          airTime: createRangeSliderMachine(crossfilterId, "airTime"),
        },
      },
    },
  },
  {
    guards: {
      brushExists: (context, event) => context.brushExists.get(event.viewName),
      activeBrushExists: (context, event) =>
        context.brushExists.get(context.activeViewName),
      targetMatches: (context, event, { cond }) => event.target == cond.target,
      progressA: (context, event) =>
        context.view.get(context.activeViewName).signal("brush")[0] >
        context.valueA.get(context.activeViewName),
      regressA: (context, event) =>
        context.view.get(context.activeViewName).signal("brush")[0] <
        context.valueA.get(context.activeViewName),
      progressB: (context, event) =>
        context.view.get(context.activeViewName).signal("brush")[1] >
        context.valueB.get(context.activeViewName),
      regressB: (context, event) =>
        context.view.get(context.activeViewName).signal("brush")[1] <
        context.valueB.get(context.activeViewName),
      minA: (context, event) =>
        context.valueA.get(context.activeViewName) ==
        context.minValue.get(context.activeViewName),
      maxA: (context, event) =>
        context.valueA.get(context.activeViewName) ==
        context.maxValue.get(context.activeViewName),
      minB: (context, event) =>
        context.valueB.get(context.activeViewName) ==
        context.minValue.get(context.activeViewName),
      maxB: (context, event) =>
        context.valueB.get(context.activeViewName) ==
        context.maxValue.get(context.activeViewName),
      minBar: (context, event) => {
        const minValue = context.minValue.get(context.activeViewName);
        return (
          context.valueA.get(context.activeViewName) == minValue ||
          context.valueB.get(context.activeViewName) == minValue
        );
      },
      maxBar: (context, event) => {
        const maxValue = context.maxValue.get(context.activeViewName);
        return (
          context.valueA.get(context.activeViewName) == maxValue ||
          context.valueB.get(context.activeViewName) == maxValue
        );
      },
      minMaxBar: (context, event) => {
        const minValue = context.minValue.get(context.activeViewName);
        const maxValue = context.maxValue.get(context.activeViewName);
        const valueA = context.valueA.get(context.activeViewName);
        const valueB = context.valueB.get(context.activeViewName);
        return (
          (valueA == minValue && valueB == maxValue) ||
          (valueA == maxValue && valueB == minValue)
        );
      },
    },
    actions: {
      setActiveView: assign({
        activeViewName: (context, event) => event.viewName,
      }),
      resetActiveView: assign({
        activeViewName: null,
      }),
      setBrushExists: assign({
        brushExists: (context, event) =>
          context.brushExists.set(context.activeViewName, true),
      }),
      resetBrushExists: assign({
        brushExists: (context, event) =>
          context.brushExists.set(context.activeViewName, false),
      }),
      updateValues: assign({
        valueA: (context, event) =>
          context.valueA.set(
            context.activeViewName,
            context.view.get(context.activeViewName).signal("brush")[0]
          ),
        valueB: (context, event) =>
          context.valueB.set(
            context.activeViewName,
            context.view.get(context.activeViewName).signal("brush")[1]
          ),
      }),
      resetValues: assign({
        valueA: (context, event) =>
          context.valueA.set(context.activeViewName, 0),
        valueB: (context, event) =>
          context.valueB.set(context.activeViewName, 0),
      }),
    },
  }
);
