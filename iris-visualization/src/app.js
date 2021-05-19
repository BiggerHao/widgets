
import { inspect } from '@xstate/inspect';
inspect({
    // options
    url: 'https://statecharts.io/inspect', // (default)
    iframe: false // open in new window
});
import { toDirectedGraph } from '@xstate/graph';
import { createMachine, interpret } from 'xstate';
import irisData from './../res/iris.csv'
import machine from './machines/machine';
import controllers from './controllers';
import { hierarchy } from 'd3-hierarchy';

let d3Init = false;
let width = 450;

var nextEvents = [];
var nextStates = {};
var latencies = {};
// controllers
var d3Controller = controllers.d3Controller;
var vegaController = controllers.vegaController;
// vega custom scheme
vegaController.setCustomScheme(d3Controller.getCustomScheme());

// Stateless machine definition
const visMachine = createMachine(machine);
const diGraph = toDirectedGraph(visMachine);
console.log("digraph", diGraph);

const observer = new PerformanceObserver(function (list) {
    list.getEntries().forEach(entry => {
        if (entry.name != "START") {
            if (!latencies[entry.name]) {
                // if latency does not exist, create it
                latencies[entry.name] = {
                    start: 0,
                    duration: 0,
                    latency: 0
                };
            }
            if (entry.startTime != 0) {
                latencies[entry.name].start = entry.startTime;
            }
            if (entry.duration != 0) {
                latencies[entry.name].duration = entry.duration;
            }
        }
    });
    Object.keys(latencies).forEach(event => {
        let eventData = latencies[event];
        eventData.latency = Math.abs(eventData.duration - eventData.start);
    });
});

const printState = function (stateValue) {
    return typeof stateValue === "string" ? stateValue : JSON.stringify(stateValue);
}

const filterChild = function (children, name) {
    return children ? children.filter(child => child.stateNode.key == name)[0] : null;
}

const getHierarchyStates = function (currentState) {
    let states = [];
    let parent = typeof currentState === "string" ? null : Object.keys(currentState)[0];
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

const addEdge = function(edge, hierarchy, depth, parentKey){
    let destination = edge.target.path.join(" ");
    let initial = edge.target.initial
    destination+= initial!=null && !edge.target.path.includes(initial) ? " "+initial : "";
    return {
        target: {
            event: edge.transition.event,
            cond: edge.transition.cond ? edge.transition.cond.name : "",
            destination: destination
           
        },
        child: depth < 1 ? predictiveStep(null, depth, hierarchy, parentKey) : []
    }
}
const predictiveStep = function (currentState, depth, hierarchy, parentNode) {
    let step = []
    if (depth == null) {
        depth = 0;
        hierarchy = getHierarchyStates(currentState);
    }
    else {
        depth++;
    }

    // if current state is inside a fsm (i.e. is an object, get parent)
    let subgraphs = [];
    hierarchy && hierarchy.forEach((node, index) => {
        let nodeObj = filterChild(index == 0 ? diGraph.children : subgraphs[index - 1].children, node);
        nodeObj && subgraphs.push(nodeObj);
    });
    
    subgraphs.forEach(subgraph => {
        subgraph.edges.forEach(edge => {
            let newHierarchy = edge.target.path;
            if (!newHierarchy.includes(edge.target.key)) {
                newHierarchy.push(edge.target.key);
            }
            
            step.push(addEdge(edge, newHierarchy, depth, subgraph.stateNode.key));
        });

        if(depth ==1 && subgraph.stateNode.initial){
            let initialState = subgraph.children.filter(child => child.stateNode.key == subgraph.stateNode.initial)[0];
            if(initialState && parentNode == "rest"){
                initialState.edges.forEach(edge =>{
                    step.push(addEdge(edge, null, depth, parentNode));
                })
            }
        }
        
    });

    return step;
}
/**
 * @deprecated
 * @param {*} eventString 
 * @param {*} currentState 
 * @returns 
 */
const getEventNextStates = function (eventString, currentState) {
    let nextStates = [];
    // if current state is inside a fsm (i.e. is an object, get parent)
    let parent = typeof currentState === "string" ? null : Object.keys(currentState)[0];
    // get the obj associated to the current state: if parent is defined, first get it, otherwise go directly to current state
    let currentStateObj = parent != null ? machine.states[parent].states[currentState[parent]] : machine.states[currentState];
    // if parent has the event defined, get from it 
    if (parent && machine.states[parent] && machine.states[parent].on[eventString]) {
        let parentEvent = machine.states[parent].on[eventString];
        nextStates.push({ target: parentEvent.target });
    }
    // if event string is "", check always field within current state
    if (currentStateObj && currentStateObj.always != null && eventString == "") {
        let alwaysActions = currentStateObj.always;
        if (Array.isArray(alwaysActions)) {
            // if always is an array, check all the actions
            alwaysActions.forEach(alwaysAction => {
                nextStates.push({ target: alwaysAction.target || "", cond: alwaysAction.cond.name });
            });
        }
        else {
            nextStates.push({ target: alwaysActions.target || "", cond: alwaysActions.cond.name });
        }
    }
    // if current state obj is defined and it has the eventstring as transition, get it
    else if (currentStateObj && currentStateObj.on[eventString]) {
        let onObj = currentStateObj.on[eventString]
        // if onObject has multiple destination, get all targets 
        if (Array.isArray(onObj)) {
            onObj.forEach(destination => {
                nextStates.push({ target: destination.target, cond: destination.cond.name });
            })
        }
        // otherwise, if it has only one target, get it
        else if (onObj.target) {
            nextStates.push({ target: onObj.target, cond: onObj.cond ? onObj.cond.name : null });
        }
        // otherwise, if it has actions, get target from it
        else if (onObj.actions) {
            nextStates.push({ target: onObj.actions.target || "", actions: onObj.actions.type })
        }
    }

    return nextStates;
}


const getNextStates = function (stateValue, nextEvents, context) {
    let nextStates = {};
    //console.log("next states:\n");
    service && nextEvents.forEach(eventString => {
        let nextState = getEventNextStates(eventString, stateValue);
        nextStates[eventString] = nextState;
    });
    return nextStates;
}

const createLiElement = function (div, keyString, valueString, subValueString) {
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

const printNextStates = function (predictiveStep, domElement, isFlex) {
    if (!domElement) {
        domElement = nextStatesDiv;
        domElement.innerHTML = "";
    }
    let unList = document.createElement("ul");
    predictiveStep.forEach(step =>{
        
        if (isFlex) {
            unList.className = "box";
        }
        let info = "(cond: "+(step.target.cond!="" ? step.target.cond : "none");
        // add latency
        info+=step.target.event!="" ? ", lat: "+(latencies[step.target.event] ? latencies[step.target.event].latency : 0)+" ms)" : ")";
        createLiElement(
            unList, step.target.destination, 
            step.target.event!="" ? "with "+step.target.event : "eventless",
            info
        );
        if(step.child && step.child.length > 0){
            printNextStates(step.child, unList, true);
        }
        
    })
    domElement.appendChild(unList);
}

/**
 * @deprecated
 * @param {*} futureStates 
 */
const printAvailableTransition = function (futureStates) {
    // first: clear html
    availableTransition.innerHTML = "";
    // for each transition, get corresponding obj and append it to a LI element
    Object.keys(futureStates).forEach(transition => {
        let futureState = futureStates[transition];
        createLiElement(availableTransition, (transition != "" ? transition : "always") + ": ", JSON.stringify(futureState), latencies[transition] ? "(" + latencies[transition].latency + " ms)" : "")
    })
}

const printTime = function(ts){
return new Date(ts).toTimeString().split(' ')[0]
}
const printStateStatus = function (state) {
    let stateValue = state.value;
    nextEvents = state.nextEvents;
    let eventType = state.event.type;
    let eventData = state.event.data;
    let context = state.context;
    let futureStates = getNextStates(stateValue, nextEvents, context);
    let step = predictiveStep(stateValue);
    let timestamp = Date.now()
    console.log("%s: navigating to state %o with event %s.\n- available events: %o \n- predictive step: %o \n- context: %o", printTime(timestamp), stateValue, eventType, futureStates, step, context);
    printNextStates(step);
    currentState.textContent = printState(stateValue);
    lastTransition.textContent = eventType+" ("+printTime(timestamp)+")";
    lastData.textContent = JSON.stringify(eventData) || "none";
    machineContext.textContent = JSON.stringify(context);
}

// Machine instance with internal state
const service = interpret(visMachine, { devTools: true })
    .onTransition(((state) => {
        printStateStatus(state);
        performance.measure(state.event.type);
    }).bind(this))
    .start();
// => 'inactive'

const app = async function () {

    // Register observer for mark.
    observer.observe({ entryTypes: ["measure", "mark"] });
    performance.mark("START")
    let data = await d3Controller.loadData(irisData)
        .catch(err => {
            console.log("received error ", err);
        });
    console.log("data is %o", data);
    // add event listeners to radios
    let selectionRadios = document.querySelectorAll('input[type=radio][name="vis"]');
    selectionRadios.forEach((radio, index) => {
        if (radio.checked) {
            radio.id == "d3" ? initD3(data) : initVega(data);
        }
        radio.addEventListener('change', (function () {
            radio.id == "d3" ? initD3(data) : initVega(data);
        }).bind(this))
    })

}

const initVega = function (data) {
    document.getElementById("d3_div").hidden = true;
    document.getElementById("vega_div").hidden = false;

    vegaController.createViews("scatter_vega_div", "slider_vega_div", "histogram_vega_div", data, width);
    vegaController.bindCallbacks(sendEvent.bind(this));
}

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
    if (nextEvents.length == 0 || nextEvents.includes(eventString)) {
        performance.mark(eventString);
        data && service.send({ type: eventString, data: data });
        !data && service.send(eventString);
    }
}

export default app;