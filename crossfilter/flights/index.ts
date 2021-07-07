import { App, ArrowDB, Views } from "falcon-vis";

import { EmptyLogger } from "./empty-logger";
import { config } from "../config";
import { crossfilterMachine } from "./crossfilter-machine";
import { interpret } from "xstate";
import { toDirectedGraph } from '@xstate/graph';

const MAX_DEPTH = 1;
const INITIAL_STATE = "inactive";

let diGraph;

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
views.set("DEP_TIME", {
  title: "Departure Time",
  type: "1D",
  el: createElement("departure"),
  dimension: {
    name: "DEP_TIME",
    bins: 24,
    extent: [0, 24],
    format: ".1f",
  },
});
views.set("DEP_DELAY", {
  title: "Departure Delay in Minutes",
  type: "1D",
  el: createElement("dep_delay"),
  dimension: {
    name: "DEP_DELAY",
    bins: 25,
    extent: [-20, 60],
    format: ".1f",
  },
});
views.set("ARR_DELAY", {
  title: "Arrival Delay in Minutes",
  type: "1D",
  el: createElement("arr_delay"),
  dimension: {
    name: "ARR_DELAY",
    bins: 25,
    extent: [-20, 60],
    format: ".1f",
  },
});
views.set("AIR_TIME", {
  title: "Airtime in Minutes",
  type: "1D",
  el: createElement("airtime"),
  dimension: {
    name: "AIR_TIME",
    bins: 25,
    extent: [0, 500],
    format: "d",
  },
});

const url = require("url:./flights-10k.arrow");
const db = new ArrowDB<ViewName, DimensionName>(url);

const logger = new EmptyLogger<ViewName>();

const eventTargets = {
  DISTANCE: "distance",
  ARR_TIME: "arrTime",
  DEP_TIME: "depTime",
  DEP_DELAY: "depDelay",
  ARR_DELAY: "arrDelay",
  AIR_TIME: "airTime",
};

new App(views, db, {
  config: config,
  logger: logger,
  cb: (_app) => {
    document.getElementById("loading")!.style.display = "none";

    const viewNames = [
      "DISTANCE",
      "ARR_TIME",
      "DEP_TIME",
      "DEP_DELAY",
      "ARR_DELAY",
      "AIR_TIME",
    ];
    const elementIds = {
      DISTANCE: "distance",
      ARR_TIME: "arrival",
      DEP_TIME: "departure",
      DEP_DELAY: "dep_delay",
      ARR_DELAY: "arr_delay",
      AIR_TIME: "airtime",
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
    diGraph = toDirectedGraph(crossfilterMachineWithContext);

    const crossfilterService = interpret(crossfilterMachineWithContext);
    crossfilterService.onTransition(function (state) {
      if (state.changed) {
        printStateStatus(state, crossfilterService);
      }
    });

    const viewInfo = {
      view: view,
      activeViewName: ""
    };

    registerEventListeners(
      crossfilterService,
      widget,
      chartBackground,
      reset,
      handleA,
      handleB,
      bar,
      viewInfo
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
  widget,
  chartBackground,
  reset,
  handleA,
  handleB,
  bar,
  viewInfo
) {
  // Event listeners on widget.
  for (const [viewName, singleWidget] of widget.entries()) {
    singleWidget.addEventListener("mouseenter", () => {
      crossfilterService.send({
        type: `mouseenter`,
        target: eventTargets[viewName],
      });
      viewInfo.activeViewName = viewName;
    });
    singleWidget.addEventListener("mouseleave", () => {
      crossfilterService.send("mouseleave");
      viewInfo.activeViewName = "";
    });
  }

  // Event listeners on chart background.
  for (const [viewName, singleChartBackground] of chartBackground.entries()) {
    singleChartBackground.addEventListener("mousedown", () => {
      crossfilterService.send({ type: "mousedown", target: "chart" });
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
        crossfilterService.send({ type: "mousedown", target: "A" });
      });
    });
  }

  // Event listeners on handleB.
  for (const [viewName, singleHandleB] of handleB.entries()) {
    singleHandleB.forEach(function (element) {
      element.addEventListener("mousedown", (event) => {
        crossfilterService.send({ type: "mousedown", target: "B" });
      });
    });
  }

  // Event listeners on bar.
  for (const [viewName, singleBar] of bar.entries()) {
    singleBar.addEventListener("mousedown", (event) => {
      crossfilterService.send({ type: "mousedown", target: "bar" });
    });
  }

  // Event listeners on document.
  document.addEventListener("mouseup", (event) => {
    crossfilterService.send(event);
  });
  document.addEventListener("mousemove", (event) => {
    if (viewInfo.activeViewName !== "") {
      const activeView = viewInfo.view.get(viewInfo.activeViewName);
      const brushValues = activeView.signal("brush");
      if (typeof brushValues === "object") {
        crossfilterService.send({
          type: "mousemove",
          valueA: brushValues[0],
          valueB: brushValues[1]
        });
      } else {
        crossfilterService.send("mousemove");
      }
    }
  });
}

const currentStateDisplay = document.getElementById("current-state");
const lastTransitionDisplay = document.getElementById("last-transition");
const lastDataDisplay = document.getElementById("last-data");
const activeViewDisplay = document.getElementById("active-view");
const activeViewBrushValuesDisplay = document.getElementById(
  "active-view-brush-values"
);
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
  activeViewBrushValuesDisplay.textContent =
    state.context.valueA.get(state.context.activeViewName) +
    ", " +
    state.context.valueB.get(state.context.activeViewName);
  nextStatesDisplay.innerHTML = "";
  const nextSteps = predictiveStep(state.value, null, null, null);
  printNextStates(nextSteps, nextStatesDisplay, false);
}

const printState = function (stateValue) {
  return typeof stateValue === "string"
    ? stateValue
    : JSON.stringify(stateValue);
};

const printTime = function (ts) {
  return new Date(ts).toTimeString().split(" ")[0];
};

function printNextStates(predictiveStep, domElement, isFlex) {

  let unList = document.createElement("ul");
  predictiveStep.forEach(step => {

    if (isFlex) {
      unList.className = "box";
    }
    let info = " (cond: " + (step.target.cond != "" ? step.target.cond : "none") + ")";
    createLiElement(
      unList, step.target.destination,
      step.target.event != "" ? " with " + step.target.event : "eventless",
      info
    );
    if (step.child && step.child.length > 0) {
      printNextStates(step.child, unList, true);
    }

  })
  domElement.appendChild(unList);
}

function createLiElement(div, keyString, valueString, subValueString) {
  let li = document.createElement("li");
  let key = document.createElement("strong");
  key.textContent = keyString;
  key.className = "machine";
  li.appendChild(key);
  let value = document.createElement("p");
  value.textContent = valueString;
  value.className = "machine";
  li.appendChild(value);
  if (subValueString) {
    let subValue = document.createElement("small");
    subValue.textContent = subValueString;
    subValue.className = "machine";
    li.appendChild(subValue);
  }
  div.appendChild(li);
}

/**
 * recursive algorithm that from a digraph representation of a xstate machine returns 
 * an array containing all the targets for a given state. a target contains:
 * - informations about the edge (target field)
 * - child array containing all the targets for the destination of the edge contained in the target field
 * @param {any} currentState retrieved from the Xstate interpreter
 * @param {number} depth if null, will be initialized to 0
 * @param {*} hierarchy if null, will be created from current state
 * @param {*} parentNode
 * @returns array containing all possible edges for the current state
 */
function predictiveStep(currentState, depth, hierarchy, parentNode) {
  let step = []; // array containing all possible edges for the current state 
  if (depth == null) {
    // if depth is not defined, initialize hierarchy (i.e. a string containing all the hfsm for a given state)
    depth = 0;
    hierarchy = getHierarchyStates(currentState);
  }
  else {
    depth++;
  }

  let subgraphs = []; // array containing all subgraphs for each node in the hierarchy
  hierarchy && hierarchy.forEach((node, index) => {
    let nodeObj = filterChild(index == 0 ? diGraph.children : subgraphs[index - 1].children, node);
    nodeObj && subgraphs.push(nodeObj);
  });
  // scan each subgraph
  subgraphs.forEach(subgraph => {
    // scan each edge within the subgraph
    subgraph.edges.forEach(edge => {
      // create hierarchy for  destination 
      let newHierarchy = edge.target.path;
      if (!newHierarchy.includes(edge.target.key)) {
        newHierarchy.push(edge.target.key);
      }
      // add edge to array
      step.push(createEdge(edge, newHierarchy, depth, subgraph.stateNode.key));
    });

    if (depth == MAX_DEPTH && subgraph.stateNode.initial) {
      // if depth has reached max and the fsm has an initial state, retrieve it 
      let initialState = filterChild(subgraph.children, subgraph.stateNode.initial)
      if (initialState && parentNode == INITIAL_STATE) {
        // if parent node is the initial state, add edge to array
        initialState.edges.forEach(edge => {
          step.push(createEdge(edge, null, depth, parentNode));
        })
      }
    }

  });

  return step;
}

/**
 * get the hierarchy, i.e. the parent fsm of a given xstate state node object returned by the 
 * xstate interpreter. 
 * @param {any} currentState the current state of the fsm 
 * @returns {string} the hierarchy of a given state. 
 * for example, the state {"range" : {"drag": "left"}} will return "range drag left"
 */
function getHierarchyStates(currentState) {
  let states = [];
  let parent = getStateName(currentState);
  if (parent != null) {
    if (typeof parent !== "string") {
      Object.keys(parent).forEach(child => {
        states.push(child, ...getHierarchyStates(currentState[parent][child]))
      });
    }
    else {
      states.push(parent, ...getHierarchyStates(currentState[parent]));
    }
  }
  else {
    states.push(currentState);
  }
  return states;
}

function getStateName(stateValue) {
  return typeof stateValue === "string" ? null : Object.keys(stateValue)[0];
}

function filterChild(children, name) {
  return children ? children.filter(child => child.stateNode.key == name)[0] : null;
}

/**
 * create an edge for the predictive step algorithm and re-runs the algorithm if depth has not reached
 * MAX_DEPTH, to add edges for the current target
 * @param {DirectedGraphEdge} edge 
 * @param {string} hierarchy string returned by the getHierarchyStates method
 * @param {number} depth integer containing the current depth of the predictive step algorithm
 * @param {string} parentKey id of the origin that is associated to this particular edge
 * @returns {JSON} object containing two fields: target and child 
 */
function createEdge(edge, hierarchy, depth, parentKey) {
  // get destination from path
  let destination = edge.target.path.join(" ");
  let initial = edge.target.initial; // consider also initial state (if hfsm is involved)
  destination += initial != null && !edge.target.path.includes(initial) ? " " + initial : "";
  return {
    // target, i.e. destination for a given event
    target: {
      event: edge.transition.event,
      cond: edge.transition.cond ? edge.transition.cond.name : "",
      destination: destination
    },
    // child, i.e. set of edges for the target. re-apply predictive step if depth is not max
    child: depth < MAX_DEPTH ? predictiveStep(null, depth, hierarchy, parentKey) : []
  }
}
