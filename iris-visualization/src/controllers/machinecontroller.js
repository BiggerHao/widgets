import { toDirectedGraph } from '@xstate/graph';
import { createMachine, interpret } from 'xstate';
import helpers from './../helpers';

var printHelper = helpers.printHelper;
const MAX_DEPTH = 1;
const INITIAL_STATE = "rest";

class StateInfo {
    constructor(state) {
        this.stateValue = state ? state.value : "";
        this.nextEvents = state ? state.nextEvents : [];
        this.eventType = state ? state.event.type : "";
        this.eventData = state ? state.event.data : null;
        this.context = state ? state.context : null;
        this.futureStates = null;
        this.step = null;
        this.timestamp = Date.now();
    }

    setFutureStates = function (callback) {
        this.futureStates = callback(this.stateValue, this.nextEvents);
    }

    setPredictiveStep = function (callback) {
        this.step = callback(this.stateValue);
    }

    printToConsole = function () {
        console.log("%s: navigating to state %o with event %s.\n- available events: %o \n- predictive step: %o \n- context: %o", printHelper.printTime(this.timestamp), this.stateValue, this.eventType, this.futureStates, this.step, this.context);
    }
}

class MachineController {
    constructor() {
        this.machine = null;
        this.diGraph = null;
        this.service = null;
        this.stateInfo = new StateInfo();
    }

    initMachine = function (machine) {
        this.machine = createMachine(machine);
        this.diGraph = toDirectedGraph(this.machine); // create a directed graph using the xstate graph lib
        console.log("digraph", this.diGraph);

    }

    runMachine(context, callback, isInspectorOn) {
        this.machine = this.machine.withContext(context);
        // run interpreter
        this.service = interpret(this.machine, { devTools: isInspectorOn })
            .onTransition(((state) => {
                callback && callback(state);
                // measure performance
                performance.measure(state.event.type);
            }).bind(this))
            .start();
    }

    getStateName = function (stateValue) {
        return typeof stateValue === "string" ? null : Object.keys(stateValue)[0];
    }


    /**
     * 
     * @param {*} state 
     * @returns {StateInfo} the corrensponding state infos 
     */
    setStateInfo = function (state) {
        this.stateInfo = new StateInfo(state);

        this.stateInfo.setFutureStates(this.getNextStates.bind(this));
        this.stateInfo.setPredictiveStep(this.predictiveStep.bind(this));

        this.stateInfo.printToConsole()

        return this.stateInfo;
    }


    getEventNextStates = function (eventString, currentState) {
        let nextStates = [];
        // if current state is inside a fsm (i.e. is an object, get parent)
        let parent = this.getStateName(currentState);
        // get the obj associated to the current state: if parent is defined, first get it, otherwise go directly to current state
        let currentStateObj = parent != null ? this.machine.states[parent].states[currentState[parent]] : this.machine.states[currentState];
        // if parent has the event defined, get from it 
        if (parent && this.machine.states[parent] && this.machine.states[parent].on[eventString]) {
            let parentEvent = this.machine.states[parent].on[eventString];
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
                    nextStates.push({ target: destination.target, cond: destination.cond ? destination.cond.name : "" });
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


    getNextStates = function (stateValue, nextEvents) {
        let nextStates = {};
        this.service && nextEvents.forEach(eventString => {
            let nextState = this.getEventNextStates(eventString, stateValue);
            nextStates[eventString] = nextState;
        });
        return nextStates;
    }

    /**
     * 
     * @param {DirectedGraphNode[]} children field of an xstate directed graph 
     * @param {string} name i.e. the key of that particular node 
     * @returns 
     */
    filterChild = function (children, name) {
        return children ? children.filter(child => child.stateNode.key == name)[0] : null;
    }

    /**
     * get the hierarchy, i.e. the parent fsm of a given xstate state node object returned by the 
     * xstate interpreter. 
     * @param {any} currentState the current state of the fsm 
     * @returns {string} the hierarchy of a given state. 
     * for example, the state {"range" : {"drag": "left"}} will return "range drag left"
     */
    getHierarchyStates = function (currentState) {
        let states = [];
        let parent = this.getStateName(currentState);
        if (parent != null) {
            if (typeof parent !== "string") {
                Object.keys(parent).forEach(child => {
                    states.push(child, ...this.getHierarchyStates(currentState[parent][child]))
                });
            }
            else {
                states.push(parent, ...this.getHierarchyStates(currentState[parent]));
            }
        }
        else {
            states.push(currentState);
        }
        return states;
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
    createEdge = function (edge, hierarchy, depth, parentKey) {
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
            child: depth < MAX_DEPTH ? this.predictiveStep(null, depth, hierarchy, parentKey) : []
        }
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
    predictiveStep = function (currentState, depth, hierarchy, parentNode) {
        let step = []; // array containing all possible edges for the current state 
        if (depth == null) {
            // if depth is not defined, initialize hierarchy (i.e. a string containing all the hfsm for a given state)
            depth = 0;
            hierarchy = this.getHierarchyStates(currentState);
        }
        else {
            depth++;
        }

        let subgraphs = []; // array containing all subgraphs for each node in the hierarchy
        hierarchy && hierarchy.forEach((node, index) => {
            let nodeObj = this.filterChild(index == 0 ? this.diGraph.children : subgraphs[index - 1].children, node);
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
                step.push(this.createEdge(edge, newHierarchy, depth, subgraph.stateNode.key));
            });

            if (depth == MAX_DEPTH && subgraph.stateNode.initial) {
                // if depth has reached max and the fsm has an initial state, retrieve it 
                let initialState = this.filterChild(subgraph.children, subgraph.stateNode.initial)
                if (initialState && parentNode == INITIAL_STATE) {
                    // if parent node is the initial state, add edge to array
                    initialState.edges.forEach(edge => {
                        step.push(this.createEdge(edge, null, depth, parentNode));
                    })
                }
            }

        });

        return step;
    }
}

export default new MachineController()