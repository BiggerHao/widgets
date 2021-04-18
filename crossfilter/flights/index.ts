import { App, ArrowDB, Views } from "falcon-vis";
import { config } from "../config";
import { EmptyLogger } from "./empty-logger";
import { rangeSliderMachine } from "./crossfilter-machine";
import { interpret } from "xstate";

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
// const url =
//   "https://media.githubusercontent.com/media/uwdata/flights-arrow/master/flights-10m.arrow";
const db = new ArrowDB<ViewName, DimensionName>(url);

const logger = new EmptyLogger<ViewName>();

new App(views, db, {
  config: config,
  logger: logger,
  cb: (_app) => {
    document.getElementById("loading")!.style.display = "none";

    const distance_view = _app.getVegaView("DISTANCE");
    console.log(distance_view);
    const initialContext = {
      view: distance_view,
      brushExists: false,
      handleA: [
        document.querySelector("#distance .left_grabber"),
        document.querySelector("#distance .left"),
      ],
      handleB: [
        document.querySelector("#distance .right_grabber"),
        document.querySelector("#distance .right"),
      ],
      bar: document.querySelector("#distance .brush"),
      valueA: 0,
      valueB: 0,
      minValue: distance_view.signal("bin")["start"],
      maxValue: distance_view.signal("bin")["stop"],
    };

    const rangeSliderMachineWithContext = rangeSliderMachine.withContext(
      initialContext
    );

    const rangeSliderService = interpret(
      rangeSliderMachineWithContext
    ).onTransition((state) => {
      const states = state.toStrings();
      if (states.length <= 3) {
        console.log(`${states[states.length - 1]}`);
      } else {
        let stateA = "",
          stateB = "",
          stateBar = "";
        for (const s of states) {
          if (s.includes("handleA")) {
            stateA = s;
          } else if (s.includes("handleB")) {
            stateB = s;
          } else if (s.includes("bar")) {
            stateBar = s;
          }
        }
        console.log(`${stateA}\t\t${stateB}\t\t${stateBar}`);
      }
    });

    const widget = document.querySelector("#distance");
    const chart_background = document.querySelector(
      "#distance .chart .background"
    );
    const handleA = [
      document.querySelector("#distance .left_grabber"),
      document.querySelector("#distance .left"),
    ];
    const handleB = [
      document.querySelector("#distance .right_grabber"),
      document.querySelector("#distance .right"),
    ];
    const bar = document.querySelector("#distance .brush");

    // Event listeners on widget.
    widget.addEventListener("mouseenter", () => {
      rangeSliderService.send("mouseenterWidget");
    });

    widget.addEventListener("mouseleave", () => {
      rangeSliderService.send("mouseleaveWidget");
    });

    // Event listeners on chart background.
    chart_background.addEventListener("mousedown", () => {
      rangeSliderService.send("mousedownChart");
    });

    // Event listeners on handleA.
    handleA.forEach(function (elem) {
      elem.addEventListener("mousedown", (event) => {
        rangeSliderService.send("mousedownA");
      });
    });

    handleA.forEach(function (elem) {
      elem.addEventListener("mouseenter", (event) => {
        rangeSliderService.send("mouseenterA");
      });
    });

    handleA.forEach(function (elem) {
      elem.addEventListener("mouseleave", (event) => {
        rangeSliderService.send("mouseleaveA");
      });
    });

    // Event listeners on handleB.
    handleB.forEach(function (elem) {
      elem.addEventListener("mousedown", (event) => {
        rangeSliderService.send("mousedownB");
      });
    });

    handleB.forEach(function (elem) {
      elem.addEventListener("mouseenter", (event) => {
        rangeSliderService.send("mouseenterB");
      });
    });

    handleB.forEach(function (elem) {
      elem.addEventListener("mouseleave", (event) => {
        rangeSliderService.send("mouseleaveB");
      });
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
  },
});
