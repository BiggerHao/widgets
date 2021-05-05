import { assign } from 'xstate';

/** CONDITIONS */
const isHoverRange = (context, _) => context.vis == "range";
const isHoverScatter = (context, _) => context.vis == "scatter";
const isHoverBarChart = (context, _) => context.vis == "barchart";

const isZoomIn = function (context, event) {
    let isZoom = event.data && Number(event.data.zoomScale) > Number(context.zoomScale);
    if (isZoom) {
        context.zoomScale = event.data.zoomScale;
    }
    return isZoom;
};
const isZoomOut = function (context, event) {
    let isZoom = event.data && Number(event.data.zoomScale) < Number(context.zoomScale);
    if (isZoom) {
        context.zoomScale = event.data.zoomScale;
    }
    return isZoom;
};

const isPanning = function (context, event) {
    let isPanningOn = event.data && event.data.zoomScale == context.zoomScale;
    if (isPanningOn) {
        context.panning = event.data.panning;
    }
    return isPanningOn;
};

const isMoveLeft = function (context, event) {
    // retrieve new values
    let lValues = getRangeValues(context, event, "handleL");
    let valueL = lValues[0];
    let newValueL = lValues[1];
    let rValues = getRangeValues(context, event, "handleR");
    let valueR = rValues[0];
    let newValueR = rValues[1];
    // check condition
    let moveLeft = newValueL < valueL || newValueR < valueR;
    if (moveLeft) { // if condition is satisfied, update context
        setRangeValues(context, newValueL, "handleL");
        setRangeValues(context, newValueR, "handleR");
        setRangeValues(context, event.data.range.selectedRegion, "selectedRegion");
    }
    return moveLeft;
}
const isIdle = function (context, event) {
    // retrieve new values
    let lValues = getRangeValues(context, event, "handleL");
    let valueL = lValues[0];
    let newValueL = lValues[1];
    let rValues = getRangeValues(context, event, "handleR");
    let valueR = rValues[0];
    let newValueR = rValues[1];
    // check condition
    let idle = newValueL == valueL && newValueR == valueR;

    return idle;
}
const isMoveRight = function (context, event) {
    // retrieve new values
    let lValues = getRangeValues(context, event, "handleL");
    let valueL = lValues[0];
    let newValueL = lValues[1];
    let rValues = getRangeValues(context, event, "handleR");
    let valueR = rValues[0];
    let newValueR = rValues[1];
    // check condition
    let moveRight = newValueL > valueL || newValueR > valueR;
    if (moveRight) { // if condition is satisfied, update context
        setRangeValues(context, newValueL, "handleL");
        setRangeValues(context, newValueR, "handleR");
        setRangeValues(context, event.data.range.selectedRegion, "selectedRegion");
    }
    return moveRight;
}

const getRangeValues = function (context, event, field) {
    let valueHandle = context.range[field];
    let newValueHandle = event.data.range[field];
    return [valueHandle, newValueHandle];
}
const setRangeValues = function (context, newValue, field) {
    context.range[field] = newValue;
}

const isBinHovered = (context, _) => context.hoveredBin != null;

const checkDrag = function (context, _) {
    if (context.drag) {
        context.vis = "range";
    }
    return context.drag;
};
const isHoveredBin = function (context, event) {
    let hoveredBin = false;
    // check if hover has been performed on bin
    if (event.data && event.data.hoveredBin != null) {
        hoveredBin = true;
    }
    // if hover is perfomed on bin, update context
    if (hoveredBin) {
        context.hoveredBin = event.data.hoveredBin != "" ? event.data.hoveredBin : null;
    }

    return hoveredBin;
}

const isBinSelected = function (context, event) {
    let binSelected = false;
    // check if bin has been selected
    if (context.selectedBin == null) {
        binSelected = true;
    }
    else if (event.data.selectedBin != null && event.data.selectedBin != context.selectedBin) {
        binSelected = true;
    }
    // update selected bin
    context.selectedBin = event.data.selectedBin;
    return binSelected;
}

const isBinDeselected = function (context, event) {
    return !isBinSelected(context, event);
}

const isPanLeft = (context, event) => {
    let isLeft = false;
    if (event.data && event.data.panning && context.panning.x) {
        let panning = event.data.panning;
        isLeft = context.panning.x[0] < panning.x[0] && context.panning.x[1] < panning.x[1];
        if (isLeft) {
            context.panning.x = panning.x;
        }
    }
    return isLeft;
}

const isPanRight = (context, event) => {
    let isRight = false;
    if (event.data && event.data.panning && context.panning.x) {
        let panning = event.data.panning;
        isRight = context.panning.x[0] > panning.x[0] && context.panning.x[1] > panning.x[1];
        if (isRight) {
            context.panning.x = panning.x;
        }
    }
    return isRight;
}

const isPanXIdle = (context, event) => {
    let isIdle = false;

    if (event.data && event.data.panning) {
        if (!context.panning.x) {
            context.panning.x = event.data.panning.x;
            isIdle = true;
        } else {
            let panning = event.data.panning;
            isIdle = context.panning.x[0] == panning.x[0] && context.panning.x[1] == panning.x[1];
            if (isIdle) {
                context.panning.x = panning.x;
            }
        }
    }
    return isIdle;
}

const isPanDown = (context, event) => {
    let isDown = false;
    if (event.data && event.data.panning && context.panning.y) {
        let panning = event.data.panning;
        isDown = context.panning.y[0] < panning.y[0] && context.panning.y[1] < panning.y[1];
        if (isDown) {
            context.panning.y = panning.y;
        }
    }
    return isDown;
}

const isPanUp = (context, event) => {
    let isUp = false;
    if (event.data && event.data.panning && context.panning.y) {
        let panning = event.data.panning;
        isUp = context.panning.y[0] > panning.y[0] && context.panning.y[1] > panning.y[1];
        if (isUp) {
            context.panning.y = panning.y;
        }
    }
    return isUp;
}

const isPanYIdle = (context, event) => {
    let isIdle = false;

    if (event.data && event.data.panning) {
        if (!context.panning.y) {
            context.panning.y = event.data.panning.y;
            isIdle = true;
        } else {
            let panning = event.data.panning;
            isIdle = context.panning.y[0] == panning.y[0] && context.panning.y[1] == panning.y[1];
            if (isIdle) {
                context.panning.y = panning.y;
            }
        }
    }
    return isIdle;
}

/** ACTIONS */
const setVis = assign({
    vis: (_, event) => event.data.vis,
    hoveredBin: (_, event) => event.data && event.data.hoveredBin ? event.data.hoveredBin : null
});
const resetVis = assign({
    vis: null
});
const updateVis = assign({
    vis: (_, evt) => evt.data.visName,
    hoveredBin: (_, evt) => evt.data.hoveredBin
})
/** SCATTER PLOT STATES */

const panXTransition = {
    MOUSEMOVE: [{
        target: "idle",
        actions: updateVis,
        cond: isPanXIdle
    },
    {
        target: "left",
        actions: updateVis,
        cond: isPanLeft
    },
    {
        target: "right",
        actions: updateVis,
        cond: isPanRight
    }]
};

const panYTransition = {
    MOUSEMOVE: [{
        target: "idle",
        actions: updateVis,
        cond: isPanYIdle
    },
    {
        target: "up",
        actions: updateVis,
        cond: isPanUp
    },
    {
        target: "down",
        actions: updateVis,
        cond: isPanDown
    }]
};

const scatterStates = {
    id: 'scatter',
    initial: 'hover',
    states: {
        hover: {
            id: 'scatHover',
            on: {
                MOUSEDOWN: { target: "panning" },
                WHEEL: { target: 'zoom' }
            }
        },
        zoom: {
            id: 'zoom',
            initial: 'idle',
            states: {
                idle: {
                    id: 'zoomIdle',
                    on: {
                        WHEEL: [{
                            target: "zoomedIn",
                            cond: isZoomIn
                        },
                        {
                            target: "zoomedOut",
                            cond: isZoomOut
                        }]
                    }
                },
                zoomedIn: {
                    id: 'zoomedIn',
                    on: {
                        WHEEL: [{
                            target: "zoomedIn",
                            cond: isZoomIn
                        },
                        {
                            target: "zoomedOut",
                            cond: isZoomOut
                        }]
                    }
                },
                zoomedOut: {
                    id: 'zoomedOut',
                    on: {
                        WHEEL: [{
                            target: "zoomedIn",
                            cond: isZoomIn
                        },
                        {
                            target: "zoomedOut",
                            cond: isZoomOut
                        }]
                    }
                }
            },
            on: {
                MOUSEDOWN: { target: "panning" }
            }
        },
        panning: {
            id: 'panning',
            type: 'parallel',
            states: {
                x: {
                    id: 'x',
                    initial: 'idle',
                    states: {
                        idle: {
                            on: panXTransition
                        },
                        left: {
                            on: panXTransition
                        },
                        right: {
                            on: panXTransition
                        }
                    }
                },
                y: {
                    id: 'y',
                    initial: 'idle',
                    states: {
                        idle: {
                            on: panYTransition
                        },
                        up: {
                            on: panYTransition
                        },
                        down: {
                            on: panYTransition
                        }
                    }
                }
            },
            on: {
                MOUSEUP: { target: "hover" }
            }
        }
    }
};


/** RANGE SLIDER STATES */
const dragTransitions = {
    MOUSEMOVE: [{
        target: "left",
        actions: updateVis,
        cond: isMoveLeft
    },
    {
        target: "right",
        actions: updateVis,
        cond: isMoveRight
    },
    {
        target: "idle",
        actions: updateVis,
        cond: isIdle
    }]
};

const rangeStates = {
    id: 'range',
    initial: 'hover',
    states: {
        hover: {
            id: 'rangeHover',
            on: {
                MOUSEDOWN: {
                    target: 'drag'
                },
                DBLCLICK: [
                    {
                        target: "drag.left",
                        cond: isMoveLeft
                    },
                    {
                        target: "drag.right",
                        cond: isMoveRight
                    },
                    {
                        target: "drag.idle",
                        cond: isIdle
                    }
                ]
            }
        },
        drag: {
            id: 'drag',
            initial: 'idle',
            states: {
                idle: {
                    id: 'idle',
                    on: dragTransitions
                },
                left: {
                    id: 'left',
                    on: dragTransitions
                },
                right: {
                    id: 'right',
                    on: dragTransitions
                }
            },
            on: {
                MOUSEUP: {
                    target: "hover"
                }
            }

        }

    }
}
/** BARCHART STATES */
const barCharStates = {
    id: 'barchart',
    initial: 'hover',
    states: {
        hover: {
            id: 'barHover',
            on: {
                MOUSEOVER: {
                    target: "binHovered",
                    cond: isHoveredBin
                }
            },
            always: {
                target: 'binHovered',
                cond: isBinHovered
            }
        },
        binHovered: {
            id: 'binHovered',
            on: {
                CLICK: [
                    { target: 'binClick.binSelected', cond: isBinSelected },
                    { target: 'binClick.binDeselected', cond: isBinDeselected }
                ]
            }
        },
        binClick: {
            id: 'binClick',
            states: {
                binSelected: {
                    id: 'binSelected',
                    on: {
                        CLICK: {
                            target: 'binDeselected',
                            cond: isBinDeselected
                        }
                    }
                },
                binDeselected: {
                    id: 'binDeselected',
                    on: {
                        CLICK: {
                            target: 'binSelected',
                            cond: isBinSelected
                        }
                    }
                }
            },
            on:{
                MOUSEOVER: [{
                    target: "binHovered",
                    cond: isHoveredBin
                },
                {
                    target: "hover",
                    cond: !isHoveredBin
                }]
            }
        }
    }
}
/** VIS MACHINE */
const machine = {
    id: 'vis',
    initial: 'rest',
    context: {
        vis: null,
        range: {
            handleL: 0,
            handleR: 450,
            selectedRegion: 450
        },
        zoomScale: 1,
        panning: {
            x: null,
            y: null
        },
        hoveredBin: null,
        selectedBin: null
    },
    states: {
        rest: {
            id: 'rest',
            on: {
                MOUSEOVER: {
                    actions: setVis,
                }
            },
            always: [
                { target: 'range', cond: isHoverRange },
                { target: 'scatter', cond: isHoverScatter },
                { target: 'barchart', cond: isHoverBarChart },
            ]
        },
        range: {
            on: {
                MOUSEOUT: {
                    target: "rest",
                    actions: resetVis
                }
            },
            ...rangeStates
        },
        scatter: {
            on: {
                MOUSEOUT: {
                    target: "rest",
                    actions: resetVis
                }
            },
            ...scatterStates
        },
        barchart: {
            on: {
                MOUSEOUT: {
                    target: "rest",
                    actions: resetVis,
                    cond: (context, event) => !isHoveredBin(context, event)
                }
            },
            ...barCharStates
        }
    }
}


export default machine;