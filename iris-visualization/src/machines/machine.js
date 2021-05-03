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

const isBinHovered = (context, _) => context.hoveredBin!=null;

const checkDrag = function(context, _){
    if(context.drag){
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
    if (context.selectedBin == null){
        binSelected = true;
    }
    else if(event.data.selectedBin != null && event.data.selectedBin != context.selectedBin) {
        binSelected = true;
    }
    // update selected bin
    context.selectedBin = event.data.selectedBin;
    return binSelected;
}

const isBinDeselected = function(context, event) {
    return !isBinSelected(context, event);
}

/** ACTIONS */
const setVis = assign({
    vis: (_, event) => event.data.vis,
    hoveredBin: (_, event) => event.data && event.data.hoveredBin ? event.data.hoveredBin : null
});
const resetVis = assign({
    vis: null
});
const resetDrag = assign({
    drag: false
});
/** SCATTER PLOT STATES */

const scatterStates = {
    initial: 'hover',
    states: {
        hover: {
            on: {
                MOUSEDOWN: {target: "panning"},
                MOUSEMOVE: {
                    target: "panning"
                },
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
            on: {
                MOUSEDOWN: {target: "panning"},
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
            on: {
                MOUSEDOWN: {target: "panning"},
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
        panning: {
            on: {
                MOUSEMOVE: {
                    target: "panning",
                    cond: isPanning
                },
                MOUSEUP: {target: "hover"}
            }
        }
    }
};
/** RANGE SLIDER STATES */
const dragTransitions = {
    MOUSEMOVE: [{
        target: "left",
        cond: isMoveLeft
    },
    {
        target: "right",
        cond: isMoveRight
    },
    {
        target: "drag",
        cond: isIdle
    }],
    MOUSEUP: {
        target: "hover"
    }
};

const rangeStates = {
    initial: 'hover',
    states: {
        hover: {
            on: {
                MOUSEDOWN: {
                    target: 'drag'
                },
                MOUSEMOVE: {
                    target: 'drag'
                }
            }
        },
        drag: {
            on: dragTransitions,
        },
        left: {
            on: dragTransitions
        },
        right: {
            on: dragTransitions
        }
    }
}
/** BARCHART STATES */
const barCharStates = {
    id: 'barchart',
    initial: 'hover',
    states: {
        hover: {
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
            on: {
                CLICK: [
                    { target: 'binSelected', cond: isBinSelected },
                    { target: 'binDeselected', cond: isBinDeselected }
                ]
            }
        },
        binSelected: {
            on: {
                CLICK: {
                    target: 'binDeselected',
                    cond: isBinDeselected
                }
            }
        },
        binDeselected: {
            on: {
                CLICK: {
                    target: 'binSelected',
                    cond: isBinSelected
                }
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
        panning: 0,
        hoveredBin: null,
        selectedBin: null
    },
    states: {
        rest: {
            on: {
                MOUSEOVER: {
                    actions: setVis,
                },
                MOUSEMOVE: {
                    target: "range",
                    cond: checkDrag
                },
                MOUSEUP: {
                    target: "rest",
                    actions: resetDrag
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