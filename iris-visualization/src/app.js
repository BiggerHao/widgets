import machine from './machines/machine';
import controllers from './controllers';
import datasets from './../res/datasets';
import helpers from './helpers';
import entities from './entities'

let d3Init = false;
let width = 450;

let useMachine = true;
let useQuery = true;
let useInspector = false;

// controllers
var d3Controller = controllers.d3Controller;
var vegaController = controllers.vegaController;
var machineController = controllers.machineController;
var latencyController = controllers.latencyController;
var queryController = controllers.queryController;
// helpers
var printHelper = helpers.printHelper;
// vega custom scheme
vegaController.setCustomScheme(d3Controller.getCustomScheme());

const updateApp = function (state) {
    let stateInfo = machineController.setStateInfo(state);
    // get queries
    if (useQuery) {
        let query = queryController.getQuery(stateInfo.eventType, stateInfo.eventData);
        let globalQuery = queryController.getGlobalQuery();
        let futureQueries = queryController.getFutureQueries(stateInfo.step, stateInfo.context, 1);
        console.log("generated queries:\n- current: %s\n- past: %s\n-future: %o", query, globalQuery, futureQueries);
        if(queryDashboardSwitch.checked){
            // clear dom elements 
            futureQueriesDiv.innerHTML = "";
            // print
            globalQueryText.textContent = globalQuery;
            eventQueryText.textContent = query;
            printHelper.printNextQueries(futureQueries, futureQueriesDiv);
        }
    }
    // if dashboard is checked, update it
    if (dashboardSwitch.checked) {
        // clear dom elements
        nextStatesDiv.innerHTML = "";
        // print
        printHelper.printNextStates(stateInfo.step, latencyController.latencies, nextStatesDiv);
        currentState.textContent = printHelper.printState(stateInfo.stateValue);
        lastTransition.textContent = stateInfo.eventType + " (" + printHelper.printTime(stateInfo.timestamp) + ")";
        lastData.textContent = JSON.stringify(stateInfo.eventData) || "none";
        machineContext.textContent = JSON.stringify(stateInfo.context);
    }
}

const app = async function (dataset, isMachineOn, isInspectorOn, isQueryOn) {
    useMachine = isMachineOn;
    useQuery = isQueryOn;
    useInspector = isInspectorOn;

    if (datasets[dataset]) {
        let titleString = `${datasets[dataset].title} Visualization`;
        // set page title
        title.textContent = titleString;
        titleVis.textContent = titleString;
        // send data name to table controller
        useQuery && queryController.setTable(dataset, datasets[dataset].fields);
        // Stateless machine definition
        useMachine && machineController.initMachine(machine);
        let data = await d3Controller.loadData(datasets[dataset].data)
            .catch(err => {
                console.log("received error ", err);
            });
        console.log("data is %o", data);
        // add event listeners to radios
        let selectionRadios = document.querySelectorAll('input[type=radio][name="vis"]');
        selectionRadios.forEach((radio, index) => {
            if (radio.checked) {
                radio.id == "d3" ? initD3(data) : initVega(data, dataset);
            }
            radio.addEventListener('change', (function () {
                radio.id == "d3" ? initD3(data) : initVega(data, dataset);
            }).bind(this))
        })
    }
    else {
        console.error("invalid data provided");
    }

}

const initVega = function (data, datasetName) {
    document.getElementById("d3_div").hidden = true;
    document.getElementById("vega_div").hidden = false;

    vegaController.createViews("scatter_vega_div", "slider_vega_div", "histogram_vega_div", data, datasets[datasetName].fields, datasets[datasetName].labels, datasets[datasetName].size, width);
    if(useMachine){
        machineController.runMachine(vegaController.getMachineContext(), updateApp.bind(this), useInspector)
    }
    vegaController.bindCallbacks(useMachine ? sendEvent.bind(this) : null);
}

/**
 * @deprecated
 * @param {*} data 
 */
const initD3 = function (data) {
    // set divs
    document.getElementById("d3_div").hidden = false;
    document.getElementById("vega_div").hidden = true;
    if (!d3Init) {

        d3Controller.bindData(data, sendEvent.bind(this));

        d3Init = true;
    }
}

const sendEvent = function (eventString, data) {
    // retrieve next events from controller
    let nextEvents = machineController.stateInfo.nextEvents;
    // check whether next events contains eventString
    if (nextEvents.length == 0 || nextEvents.includes(eventString)) {
        // mark performance
        performance.mark(eventString);
        data && machineController.service.send({ type: eventString, data: data });
        !data && machineController.service.send(eventString);
    }
}

export default app;