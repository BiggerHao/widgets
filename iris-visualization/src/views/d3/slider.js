import * as d3 from 'd3';

export default function (w, dataIndex) {

  let visName = "range";

  const LEFT_HANDLE_ID = "leftHandle";
  const RIGHT_HANDLE_ID = "rightHandle";
  const SLIDER_ID = "selectedRect";

  let data = [];
  let columns = [];
  let range = [];

  let valueL, valueR, dragDelta, dragL, dragR = 0;
  let dragStart = 0;
  let updateData;

  let width = w, height = 40;
  let margin = { top: 15, right: 60, bottom: 30, left: 80 };


  let x = d3.scaleLinear().range([0, width]);

  let xAxis = null;

  let handle = 'M-5.5,-5.5v10l6,5.5l6,-5.5v-10z';

  let leftDrag, rightDrag, sliderDrag, limitDragL, limitDragR = false;

  let init = true;

  let transition = null;

  // functions & callbacks
  let onChange = (valueL, valueR) => { console.log("updating valueL %f and valueR %f", valueL, valueR) } // default callback when handlers are changed
  let onEvent = (eventString, data) => { console.log("sending event %s to machine with data %o", eventString, data) } // sending event to machine

  let getValue = function (currentValue) {
    return currentValue < range[0] ? range[0] : (currentValue > range[1] ? range[1] : currentValue)
  }

  let updateSvgStyle = function (svg, id, release) {
    svg.select(["#", id].join(""))
      .attr("fill", release ? (id == SLIDER_ID ? "steelblue" : "white") : "red");
  }

  let updateSlider = function (slideElement) {
    slideElement
      .attr("width", Math.abs(valueR - valueL))
      .attr("x", (valueL < valueR ? valueL : valueR));
  }

  let updateHandle = function (handle, value) {
    handle
      .attr('transform', 'translate(' + value + ', 0)')
  }

  let createHandler = function (svg, currentValue, id) {
    let handler = svg.select(["#", id].join(""));
    if (handler.empty()) {
      handler = svg
        .append('path')
        .attr('id', id)
        .attr('d', handle)
        .attr('aria-label', 'handle')
        .attr('fill', 'white')
        .attr('stroke', 'black')
        .on('mousedown', (event) => {
          // send event
          if (!leftDrag && !rightDrag) onEvent("MOUSEDOWN");
          // update control
          if (id == LEFT_HANDLE_ID) leftDrag = true;
          else rightDrag = true;

          updateSvgStyle(svg, id, false);
        });
      // hover
      handler
        .on("mouseover", (event) => {
          onEvent("MOUSEOVER", { vis: visName });
          handler.attr("opacity", ".5");
        })
        .on("mouseout", (event) => {
          onEvent("MOUSEOUT");
          handler.attr("opacity", "1");
        })
    }

    //handler.attr('transform', 'translate(' + currentValue + ', 0)')
    updateHandle(handler, currentValue);
    return handler;
  }

  let getHandleObj = function () {
    return { range: { handleL: valueL, handleR: valueR, selectedRegion: Math.abs(valueR - valueL) } };
  }

  const slider = function (selection) {
    selection.each(function () {
      const dom = d3.select(this)
      const svg = dom.append("svg")
        .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]);

      d3.select("#d3_div").on('mouseup', (event) => {
        onEvent("MOUSEUP");
        leftDrag = false;
        rightDrag = false;
        sliderDrag = false;
        limitDragL = false;
        limitDragR = false;
        dragDelta = 0;
        dragStart = 0;
        dragL = 0;
        dragR = 0;

        updateSvgStyle(focus, SLIDER_ID, true);
        updateSvgStyle(focus, LEFT_HANDLE_ID, true);
        updateSvgStyle(focus, RIGHT_HANDLE_ID, true);
      });

      const focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      const sliderRect = focus.append("g")
        .attr("id", "slider");

      svg.on('mousemove', (event) => {
        let pointer = d3.pointer(event); // get pointer from event
        // get svg elements
        let leftHandle = focus.select(["#", LEFT_HANDLE_ID].join(""));
        let rightHandle = focus.select(["#", RIGHT_HANDLE_ID].join(""));
        let slider = focus.select(["#", SLIDER_ID].join(""));
        // check
        if (leftDrag) {
          // compute new value
          let newValueL = getValue(pointer[0] - margin.left);
          // update value
          valueL = newValueL;
          // send event
          onEvent("MOUSEMOVE", getHandleObj());
          // update handler
          updateHandle(leftHandle, valueL);
        }
        else if (rightDrag) {
          // compute new value
          let newValueR = getValue(pointer[0] - margin.left);
          // update value
          valueR = newValueR;
          // send event
          onEvent("MOUSEMOVE", getHandleObj());
          // update handler
          updateHandle(rightHandle, valueR);
        }
        else if (sliderDrag) {
          if (dragStart == 0 && pointer != null) {
            // init drag variables
            dragDelta = pointer[0] - margin.left;
            dragStart = dragDelta;
            dragL = valueL;
            dragR = valueR;
          } else if (pointer != null) {
            // get delta
            dragDelta = pointer[0] - margin.left - dragStart;
            // get new values
            let newValueL = getValue(dragL + dragDelta);
            let newValueR = getValue(dragR + dragDelta);
            // check if drag has reached limit
            if (!limitDragL) valueL = newValueL;
            if (!limitDragR) valueR = newValueR;
            //update limits
            limitDragL = valueR == range[0] || valueR == range[1];
            limitDragR = valueL == range[0] || valueL == range[1];
            onEvent("MOUSEMOVE", getHandleObj());
            // update handlers
            updateHandle(leftHandle, valueL);
            updateHandle(rightHandle, valueR);
          }

        }

        if (leftDrag || rightDrag || sliderDrag) {
          updateSlider(slider);
          onChange(x.invert(valueL), x.invert(valueR));
        }
      });

      updateData = function () {
        if (init) {
          // first time, set domain
          x.domain(d3.extent(data, d => +d[columns[dataIndex]])).nice();
          range = x.range();
          // first time: init values
          valueL = getValue(range[0]);
          valueR = getValue(range[1]);
          //first time: create axis
          xAxis = d3
            .axisBottom(x)
            //.tickFormat(d => d / 1000 + "k");
          sliderRect.append("g")
            .attr('id', "axis--x")
            .attr("transform", "translate(0," + (0) + ")")
            .attr("stroke-width", "2")
            .call(xAxis)
            .on("dblclick", function (event) {
              let clickValue = getValue(d3.pointer(event)[0] - margin.left);
              console.log("click value ", clickValue);
            });
          // first time: label x
          sliderRect.append("text")
            .attr("transform",
              "translate(" + width / 2 + " ," +
              (margin.bottom) + ")")
            .style("text-anchor", "middle")
            .attr("id", "axis-x--text")
            .text(columns[dataIndex]+" (cm)");
          // set init to false
          init = false;
        }
        else {
          transition = sliderRect.transition().duration(100);
          focus.select("#axis--x")
            .transition(transition)
            .call(xAxis.scale(x));
        }

        let selectionSlider = sliderRect.select(["#", SLIDER_ID].join(""));
        if (selectionSlider.empty()) {
          selectionSlider = sliderRect
            .append('rect')
            .attr("id", SLIDER_ID)
            .attr("y", -2)
            .attr("height", 4)
            .attr("stroke", "black")
            .attr("fill", "steelblue")
            .on("mousedown", function (event) {
              if (!sliderDrag) onEvent("MOUSEDOWN");
              updateSvgStyle(focus, SLIDER_ID, false);
              sliderDrag = true;
            });
          // hover
          selectionSlider
            .on("mouseover", (event) => {
              selectionSlider.attr("opacity", ".5");
              onEvent("MOUSEOVER", { vis: visName });
            })
            .on("mouseout", (event) => {
              onEvent("MOUSEOUT");
              selectionSlider.attr("opacity", "1");
            })
        }

        updateSlider(selectionSlider);

        createHandler(focus, valueL, LEFT_HANDLE_ID);
        createHandler(focus, valueR, RIGHT_HANDLE_ID);

        onChange(x.invert(valueL), x.invert(valueR));

      }
    })
  }

  slider.data = function (newData) {
    if (!arguments.length) {
      return data;
    }
    data = newData;
    columns = data.columns;

    if (typeof updateData === 'function') {
      updateData()
    }
    return slider
  }

  slider.scale = function (newScale) {

    let oldValueL = x.invert(valueL);
    let oldValueR = x.invert(valueR);
    x = newScale;
    range = x.range();

    valueL = getValue(x(oldValueL));
    valueR = getValue(x(oldValueR));

    if (typeof updateData === 'function') {
      updateData();
    }
    return slider
  }

  // bindings
  slider.bindCallback = (onChangeCallback, onMachineCallback) => {
    onChange = onChangeCallback;
    onEvent = onMachineCallback;
  }

  return slider;
}