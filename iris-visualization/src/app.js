
import { inspect } from '@xstate/inspect';
inspect({
    // options
    url: 'https://statecharts.io/inspect', // (default)
    iframe: false // open in new window
});

import { createMachine, interpret } from 'xstate';
import irisData from './../res/iris.csv'
import machine from './machines/machine';
import controllers from './controllers';

let d3Init = false;
let width = 450;

var nextEvents = [];
// controllers
var d3Controller = controllers.d3Controller;
var vegaController = controllers.vegaController;
// vega custom scheme
vegaController.setCustomScheme(d3Controller.getCustomScheme());

// Stateless machine definition
const visMachine = createMachine(machine);

const printState = function (stateValue) {
    return typeof stateValue === "string" ? stateValue : JSON.stringify(stateValue);
}

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

const printNextStates = function (futureStates) {
    // first: clear html
    availableTransition.innerHTML = "";
    // for each transition, get corresponding obj and append it to a LI element
    Object.keys(futureStates).forEach(transition => {
        let futureState = futureStates[transition];
        let li = document.createElement("li");
        let key = document.createElement("strong");
        key.textContent = (transition != "" ? transition : "always") + ": ";
        key.className = "machine";
        li.appendChild(key);
        let value = document.createElement("p");
        value.textContent = JSON.stringify(futureState);
        value.className = "machine";
        li.appendChild(value);
        availableTransition.appendChild(li);
    })

}

const printStateStatus = function (state) {
    let stateValue = state.value;
    nextEvents = state.nextEvents;
    let eventType = state.event.type;
    let eventData = state.event.data;
    let context = state.context;
    let futureStates = getNextStates(stateValue, nextEvents, context);

    console.log("navigating to state %o with event %s.\navailable events: %o \ncontext: %o", stateValue, eventType, futureStates, context);
    printNextStates(futureStates);
    currentState.textContent = printState(stateValue);
    lastTransition.textContent = eventType;
    lastData.textContent = JSON.stringify(eventData) || "none";
    machineContext.textContent = JSON.stringify(context);
}

// Machine instance with internal state
const service = interpret(visMachine, { devTools: true })
    .onTransition(((state) => printStateStatus(state)).bind(this))
    .start();
// => 'inactive'

const app = async function () {

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
        data && service.send({ type: eventString, data: data });
        !data && service.send(eventString);
    }
    else{
        console.log("event %s forbidden", eventString);
    }
}

export default app;