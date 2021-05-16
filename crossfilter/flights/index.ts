import { App, ArrowDB, Views } from "falcon-vis";
import { config } from "../config";
import { EmptyLogger } from "./empty-logger";
import { crossfilterMachine } from "./crossfilter-machine";
import { interpret, mapState } from "xstate";

document.getElementById("app")!.innerText = "";

function createElement(id: string) {
  const el = document.createElement("div");
  el.setAttribute("id", id);
  document.getElementById("app")!.appendChild(el);
  return el;
}

type ViewName =
  | "DISTANCE"
  | "DEP_TIME"
  | "ARR_TIME"
  | "AIR_TIME"
  | "ARR_DELAY"
  | "DEP_DELAY"
  //  | "DEP_DELAY_ARR_DELAY"
  | "COUNT";

type DimensionName =
  | "ARR_DELAY"
  | "ARR_TIME"
  | "DISTANCE"
  | "DEP_DELAY"
  | "AIR_TIME"
  | "DEPARTURE"
  | "DEP_TIME";

const views: Views<ViewName, DimensionName> = new Map();

views.set("COUNT", {
  title: "Flights selected",
  type: "0D",
  el: createElement("count"),
});
views.set("DISTANCE", {
  title: "Distance in Miles",
  type: "1D",
  el: createElement("distance"),
  dimension: {
    name: "DISTANCE",
    bins: 25,
    extent: [0, 5000],
    format: "d",
  },
});
views.set("ARR_TIME", {
  title: "Arrival Time",
  type: "1D",
  el: createElement("arrival"),
  dimension: {
    name: "ARR_TIME",
    bins: 24,
    extent: [0, 24],
    format: ".1f",
  },
});
// views.set("DEP_TIME", {
//   title: "Departure Time",
//   type: "1D",
//   el: createElement("departure"),
//   dimension: {
//     name: "DEP_TIME",
//     bins: 24,
//     extent: [0, 24],
//     format: ".1f",
//   },
// });
// views.set("DEP_DELAY", {
//   title: "Departure Delay in Minutes",
//   type: "1D",
//   el: createElement("dep_delay"),
//   dimension: {
//     name: "DEP_DELAY",
//     bins: 25,
//     extent: [-20, 60],
//     format: ".1f",
//   },
// });
// views.set("ARR_DELAY", {
//   title: "Arrival Delay in Minutes",
//   type: "1D",
//   el: createElement("arr_delay"),
//   dimension: {
//     name: "ARR_DELAY",
//     bins: 25,
//     extent: [-20, 60],
//     format: ".1f",
//   },
// });
// views.set("AIR_TIME", {
//   title: "Airtime in Minutes",
//   type: "1D",
//   el: createElement("airtime"),
//   dimension: {
//     name: "AIR_TIME",
//     bins: 25,
//     extent: [0, 500],
//     format: "d",
//   },
// });

const url = require("url:./flights-10k.arrow");
// const url =
//   "https://media.githubusercontent.com/media/uwdata/flights-arrow/master/flights-10m.arrow";
const db = new ArrowDB<ViewName, DimensionName>(url);

const logger = new EmptyLogger<ViewName>();

new App(views, db, {
  config: config,
  logger: logger,
  cb: (_app) => {
    document.getElementById("loading")!.style.display = "none";

    const viewNames = ["DISTANCE", "ARR_TIME"];
    const elementIds = {
      DISTANCE: "distance",
      ARR_TIME: "arrival",
    };
    const eventNameSuffixes = {
      DISTANCE: "Distance",
      ARR_TIME: "ArrTime",
    };
    const view = getViews(_app, viewNames);
    const brushExists = new Map();
    const widget = new Map();
    const chartBackground = new Map();
    const reset = new Map();
    const handleA = new Map();
    const handleB = new Map();
    const bar = new Map();
    const valueA = new Map();
    const valueB = new Map();
    const minValue = new Map();
    const maxValue = new Map();

    for (const viewName of viewNames) {
      brushExists.set(viewName, false);
      valueA.set(viewName, 0);
      valueB.set(viewName, 0);
    }

    getWidgetComponents(
      elementIds,
      widget,
      chartBackground,
      reset,
      handleA,
      handleB,
      bar
    );

    getSliderRange(view, minValue, maxValue);

    const initialContext = {
      view: view,
      activeViewName: null,
      brushExists: brushExists,
      handleA: handleA,
      handleB: handleB,
      bar: bar,
      valueA: valueA,
      valueB: valueB,
      minValue: minValue,
      maxValue: maxValue,
    };

    const crossfilterMachineWithContext =
      crossfilterMachine.withContext(initialContext);

    const crossfilterService = interpret(crossfilterMachineWithContext);
    crossfilterService.onTransition(function (state) {
      if (state.changed) {
        printStateStatus(state, crossfilterService);
      }
    });

    registerEventListeners(
      crossfilterService,
      eventNameSuffixes,
      widget,
      chartBackground,
      reset,
      handleA,
      handleB,
      bar
    );

    crossfilterService.start();
  },
});

function getViews(app, viewNames) {
  const view = new Map();
  viewNames.forEach((viewName) => {
    view.set(viewName, app.getVegaView(viewName));
  });
  return view;
}

function getWidgetComponents(
  elementIds,
  widget,
  chartBackground,
  reset,
  handleA,
  handleB,
  bar
) {
  for (const viewName in elementIds) {
    const elementId = elementIds[viewName];

    widget.set(viewName, document.querySelector(`#${elementId}`));

    chartBackground.set(
      viewName,
      document.querySelector(`#${elementId} .chart .background`)
    );

    reset.set(viewName, document.querySelector(`#${elementId} .reset`));

    const handleAComponents = [
      document.querySelector(`#${elementId} .left_grabber`),
      document.querySelector(`#${elementId} .left`),
    ];
    handleA.set(viewName, handleAComponents);

    const handleBComponents = [
      document.querySelector(`#${elementId} .right_grabber`),
      document.querySelector(`#${elementId} .right`),
    ];
    handleB.set(viewName, handleBComponents);

    bar.set(viewName, document.querySelector(`#${elementId} .brush`));
  }
}

function getSliderRange(view, minValue, maxValue) {
  for (const [viewName, singleView] of view.entries()) {
    minValue.set(viewName, singleView.signal("bin")["start"]);
    maxValue.set(viewName, singleView.signal("bin")["stop"]);
  }
}

function registerEventListeners(
  crossfilterService,
  eventNameSuffixes,
  widget,
  chartBackground,
  reset,
  handleA,
  handleB,
  bar
) {
  // Event listeners on widget.
  for (const [viewName, singleWidget] of widget.entries()) {
    const eventNameSuffix = eventNameSuffixes[viewName];

    singleWidget.addEventListener("mouseenter", () => {
      crossfilterService.send({
        type: `mouseenter${eventNameSuffix}`,
        viewName: viewName,
      });
    });
    singleWidget.addEventListener("mouseleave", () => {
      crossfilterService.send("mouseleaveWidget");
    });
  }

  // Event listeners on chart background.
  for (const [viewName, singleChartBackground] of chartBackground.entries()) {
    singleChartBackground.addEventListener("mousedown", () => {
      crossfilterService.send("mousedownChart");
    });
  }

  // Event listeners on reset button.
  for (const [viewName, singleReset] of reset.entries()) {
    singleReset.addEventListener("click", () => {
      crossfilterService.send("clickReset");
    });
  }

  // Event listeners on handleA.
  for (const [viewName, singleHandleA] of handleA.entries()) {
    singleHandleA.forEach(function (element) {
      element.addEventListener("mousedown", (event) => {
        crossfilterService.send("mousedownA");
      });
    });
    singleHandleA.forEach(function (element) {
      element.addEventListener("mouseenter", (event) => {
        crossfilterService.send("mouseenterA");
      });
    });
    singleHandleA.forEach(function (element) {
      element.addEventListener("mouseleave", (event) => {
        crossfilterService.send("mouseleaveA");
      });
    });
  }

  // Event listeners on handleB.
  for (const [viewName, singleHandleB] of handleB.entries()) {
    singleHandleB.forEach(function (element) {
      element.addEventListener("mousedown", (event) => {
        crossfilterService.send("mousedownB");
      });
    });
    singleHandleB.forEach(function (element) {
      element.addEventListener("mouseenter", (event) => {
        crossfilterService.send("mouseenterB");
      });
    });
    singleHandleB.forEach(function (element) {
      element.addEventListener("mouseleave", (event) => {
        crossfilterService.send("mouseleaveB");
      });
    });
  }

  // Event listeners on bar.
  for (const [viewName, singleBar] of bar.entries()) {
    singleBar.addEventListener("mousedown", (event) => {
      crossfilterService.send("mousedownBar");
    });
    singleBar.addEventListener("mouseenter", (event) => {
      crossfilterService.send("mouseenterBar");
    });
    singleBar.addEventListener("mouseleave", (event) => {
      crossfilterService.send("mouseleaveBar");
    });
  }

  // Event listeners on document.
  document.addEventListener("mouseup", (event) => {
    crossfilterService.send(event);
  });
  document.addEventListener("mousemove", (event) => {
    crossfilterService.send(event);
  });
}

const currentStateDisplay = document.getElementById("current-state");
const lastTransitionDisplay = document.getElementById("last-transition");
const lastDataDisplay = document.getElementById("last-data");
const activeViewDisplay = document.getElementById("active-view");
const distanceBrushValuesDisplay = document.getElementById(
  "distance-brush-values"
);
const arrivalBrushValuesDisplay = document.getElementById(
  "arrival-brush-values"
);
const nextEventsDisplay = document.getElementById("next-events");
const nextStatesDisplay = document.getElementById("next-states");

function printStateStatus(state, service) {
  const stateValue = state.value;
  const eventType = state.event.type;
  const eventData = state.event.viewName;
  const timestamp = Date.now();
  currentStateDisplay.textContent = printState(stateValue);
  lastTransitionDisplay.textContent = `${eventType} (${printTime(timestamp)})`;
  if (eventData !== undefined) {
    lastDataDisplay.textContent = `viewName: ${eventData}`;
  } else {
    lastDataDisplay.textContent = "";
  }
  activeViewDisplay.textContent = state.context.activeViewName;
  distanceBrushValuesDisplay.textContent =
    state.context.valueA.get("DISTANCE") +
    ", " +
    state.context.valueB.get("DISTANCE");
  arrivalBrushValuesDisplay.textContent =
    state.context.valueA.get("ARR_TIME") +
    ", " +
    state.context.valueB.get("ARR_TIME");
  nextEventsDisplay.textContent = state.nextEvents.join(", ");
  const nextStates = new Map();
  state.nextEvents.map((event) => {
    nextStates.set(event, service.nextState(event).value);
  });
  displayNextStates(nextStates);
}

const printState = function (stateValue) {
  return typeof stateValue === "string"
    ? stateValue
    : JSON.stringify(stateValue);
};

const printTime = function (ts) {
  return new Date(ts).toTimeString().split(" ")[0];
};

function displayNextStates(nextStates) {
  nextStatesDisplay.innerHTML = "";
  for (const [eventName, state] of nextStates.entries()) {
    const nextStateListItem = document.createElement("li");
    nextStateListItem.innerHTML = `<pre class="machine">${printState(
      state
    )}</pre> from ${eventName}`;
    nextStatesDisplay.append(nextStateListItem);
  }
}
