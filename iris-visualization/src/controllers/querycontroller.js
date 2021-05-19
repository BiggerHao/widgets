import squel from 'squel';
import EventData from '../entities/eventdata';
import EventQuery from '../entities/eventquery';
import MachineContext from '../entities/machine_context';
import consts from './../consts'

let events = consts.events;
let fields = consts.fields;
let visNames = consts.vis;

/**
 * @param {EventData} eventData
 * @param {String} field
 */


class QueryController {
    constructor() {
        this.tableName = "";
        this.tableFields = [];
        this.eventQueries = {};
        this.visQueries = {};

    }

    checkQuery = function (eventData, field, subField) {
        if (!subField) {
            return eventData[field] != null;
        }
        else {
            return eventData[field] && eventData[field][subField] != null;
        }
    }

    checkScatter = function (eventData) {
        return this.checkQuery(eventData, "panning", "x") && this.checkQuery(eventData, "panning", "x", "y");
    }

    /**
     * 
     * @param {EventData} eventData 
     * @returns 
     */
    getScatterXValues = function (eventData) {
        return eventData.panning.x;
    }

    /**
     * 
     * @param {EventData} eventData 
     * @returns 
     */
    getScatterYValues = function (eventData) {
        return eventData.panning.y;
    }

    checkRange = function (eventData) {
        return this.checkQuery(eventData, "range", "handleL") && this.checkQuery(eventData, "range", "handleR");
    }

    /**
     * 
     * @param {EventData} eventData 
     * @returns {Array<number>}
     */
    getRangeValues = function (eventData) {
        return [eventData.range.handleL, eventData.range.handleR].sort((a, b) => a - b);
    }

    /**
     * 
     * @param {Array<number>} array 
     * @param {MachineContext} context 
     * @returns 
     */
    verifyRangeValues = function (array, context) {
        if (array && context.range.minL!=null && context.range.maxR!=null) {
            if (array[0] < context.range.minL) {
                array[0] = context.range.minL;
            }
            if (array[1] > context.range.maxR) {
                array[1] = context.range.maxR;
            }
        }
        return array;
    }

    checkBarChart = function (eventData) {
        return this.checkQuery(eventData, "selectedBin")
    }

    /**
     * 
     * @param {EventData} eventData 
     * @returns {Array<number>}
     */
    getBarChartValues = function (eventData) {
        if (eventData.selectedBin) {
            return eventData.selectedBin.split("-");
        }
        else if (eventData.hoveredBin) {
            return eventData.hoveredBin.split("-")
        }
        else {
            return [];
        }
    }

    /**
     * 
     * @param {MachineContext} context 
     */
    getNegativeDeltaContext = function (context) {
        context.range.handleL = Number((context.range.handleL - 0.1).toFixed(1));
        context.range.handleR = Number((context.range.handleR - 0.1).toFixed(1));
        context.panning.x[0] = Number((context.panning.x[0] - 0.1).toFixed(1));
        context.panning.x[1] = Number((context.panning.x[1] - 0.1).toFixed(1));
        context.panning.y[0] = Number((context.panning.y[0] - 0.1).toFixed(1));
        context.panning.y[1] = Number((context.panning.y[1] - 0.1).toFixed(1));
        return context;
    }

    /**
     * 
     * @param {MachineContext} context 
     */
    getPositiveDeltaContext = function (context) {
        context.range.handleL = Number((context.range.handleL + 0.1).toFixed(1));
        context.range.handleR = Number((context.range.handleR + 0.1).toFixed(1));
        context.panning.x[0] = Number((context.panning.x[0] + 0.1).toFixed(1));
        context.panning.x[1] = Number((context.panning.x[1] + 0.1).toFixed(1));
        context.panning.y[0] = Number((context.panning.y[0] + 0.1).toFixed(1));
        context.panning.y[1] = Number((context.panning.y[1] + 0.1).toFixed(1));
        return context;
    }

    setTable = function (name, dataFields) {
        // set table name
        this.tableName = name;
        // populate data fields
        Object.keys(dataFields).forEach(field => {
            this.tableFields.push(dataFields[field])
        });
        // populate vis queries
        this.visQueries[visNames.barchart] = null;
        this.visQueries[visNames.scatter] = null;
        this.visQueries[visNames.slider] = null;
        /** queries for mousemove event */
        this.eventQueries[events.MOUSEMOVE] = {};
        // scatter
        this.eventQueries[events.MOUSEMOVE][visNames.scatter] = new EventQuery(
            "scatter_pan",
            [dataFields[fields.xField], dataFields[fields.yField]],
            this.checkScatter.bind(this),
            [this.getScatterXValues.bind(this), this.getScatterYValues.bind(this)],
            "range",
            true
        );
        // range 
        this.eventQueries[events.MOUSEMOVE][visNames.slider] = new EventQuery(
            "range_move",
            [dataFields[fields.rangeField]],
            this.checkRange.bind(this),
            [this.getRangeValues.bind(this)],
            "range",
            true,
            this.verifyRangeValues.bind(this)
        );
        /** queries for click event */
        this.eventQueries[events.CLICK] = {};
        // barchart
        this.eventQueries[events.CLICK][visNames.barchart] = new EventQuery(
            "barchart_click",
            [dataFields[fields.binField]],
            this.checkBarChart.bind(this),
            [this.getBarChartValues.bind(this)],
            "toggle",
            false
        );
        /** queries for wheel event event */
        this.eventQueries[events.WHEEL] = {};
        // scatter: same as scatter mousemove
        this.eventQueries[events.WHEEL][visNames.scatter] = this.eventQueries[events.MOUSEMOVE][visNames.scatter]
        /** queries for dblclick event:  */
        // range : same as range mousemove
        this.eventQueries[events.DBLCLICK] = {};
        this.eventQueries[events.DBLCLICK][visNames.slider] = this.eventQueries[events.MOUSEMOVE][visNames.slider];
    }

    /**
     * 
     * @param {EventQuery} eventQuery 
     * @param {EventData} eventData
     * @param {String?} vis 
     * @param {boolean?} useValues
     * @returns 
     */
    createQuery(eventQuery, eventData, vis = null, useValues = true) {
        let sqlStatement = null;
        let queryFields = eventQuery.fields;
        let values = eventQuery.values;
        if (queryFields && values) {
            let query = squel.select().from(this.tableName)
            this.tableFields.forEach(field => {
                query.field(field);
            })
            if (vis) this.visQueries[vis] = [];
            queryFields.forEach((field, index) => {
                let rangeValues = useValues ? values[index](eventData) : null;
                // verify range values if present
                if (eventQuery.verify != null) {
                    rangeValues = eventQuery.verify(rangeValues, eventData);
                }
                let predicate = `${field} IN ?`;
                let expression = rangeValues ? squel.str('RANGE(?, ?)', rangeValues[0], rangeValues[1]) : squel.str('RANGE(?, ?)')
                vis && this.visQueries[vis].push({ predicate: predicate, expression: expression });
                query.where(predicate, expression);
            })
            sqlStatement = query.toString();
        }
        return sqlStatement;
    }
    /**
     * @param {String} eventType
     * @param {EventData} eventData 
     */
    getQuery = function (eventType, eventData) {
        let sqlStatement = null;
        if (this.eventQueries[eventType] && eventData) {
            let events = this.eventQueries[eventType];
            Object.keys(events).forEach(vis => {
                if (events[vis].cond(eventData)) {
                    sqlStatement = this.createQuery(events[vis], eventData, vis);
                }
                else if (!events[vis].stateless) {
                    this.visQueries[vis] = null;
                }
            })
        }
        return sqlStatement;
    }

    getGlobalQuery = function () {
        let query = squel.select().from(this.tableName)
        this.tableFields.forEach(field => {
            query.field(field);
        })
        Object.keys(this.visQueries).forEach(visQuery => {
            if (this.visQueries[visQuery] != null) {
                this.visQueries[visQuery].forEach(obj => {
                    query.where(obj.predicate, obj.expression);
                })

            }
        })
        return query.toString();
    }

    /**
     * 
     * @param {*} predictiveStep 
     * @param {MachineContext} context 
     * @param {*} maxDepth
     * @param {*} currentDepth 
     * @param {*} parentQuery 
     * @returns 
     */
    getFutureQueries = function (predictiveStep, context, maxDepth, currentDepth = 0, parentQuery) {
        let queries = {};
        //console.log(predictiveStep, maxDepth);
        predictiveStep.forEach(pred => {
            let localDepth = currentDepth;
            //retrieve the event query object giving the event and the vis retrieved from the predicate
            let eventQuery = this.eventQueries[pred.target.event] != null ? this.eventQueries[pred.target.event][pred.target.destination.split(" ")[0]] : null;
            // check if target is associated to a specific query and it's not already defined on previous step
            if (eventQuery != null && (parentQuery == null || parentQuery.id != eventQuery.id)) {
                if (localDepth < maxDepth && eventQuery.type == "range") {
                    queries[pred.target.destination.split(" ")[0]] = {};
                    let predQuery = queries[pred.target.destination.split(" ")[0]];
                    eventQuery.fields.forEach(field => {
                        // for each field, create two query, 
                        // representing the minimum variation from current position
                        let negativeQuery = this.createQuery(eventQuery, this.getNegativeDeltaContext(context), null, true);
                        predQuery[`${field}-`] = { sql: negativeQuery.toString(), depth: localDepth };
                        let positiveQuery = this.createQuery(eventQuery, this.getPositiveDeltaContext(context), null, true);
                        predQuery[`${field}+`] = { sql: positiveQuery.toString(), depth: localDepth };
                    })
                }
                else {
                    // if query exist, get it
                    let query = this.createQuery(eventQuery, context, null, localDepth < maxDepth);
                    // add query to return variable
                    queries[pred.target.destination.split(" ")[0]] = { sql: query.toString(), depth: localDepth };
                }
            }
            // if current depth < maxDepth, re-run alg
            if (localDepth < maxDepth) {
                //console.log("update depth with child ", pred.child);
                localDepth++;
                let childQueries = this.getFutureQueries(pred.child, context, maxDepth, localDepth, eventQuery);
                Object.keys(childQueries).forEach(queryId => {
                    if (!queries[queryId]) {
                        queries[queryId] = childQueries[queryId];
                    }
                })
            }
        })
        return queries;
    }
}

export default new QueryController()