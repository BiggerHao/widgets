import * as d3 from 'd3'

export default function (w, binIndex, zIndex) {
  let visName = "barchart";

  let data = [];
  let columns = [];
  let slideRange = null;

  let binSelected = null;
  let binHovered = null;

  let updateData;

  let width = w, height = 230;
  let margin = { top: 15, right: 60, bottom: 50, left: 80 };


  let x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

  let xAxis, yAxis = null;

  let init = false;

  // callbacks
  let onChange = (binRange) => { console.log("received binRange %o ", binRange) } // default callback when bin is selected
  let onEvent = (eventString, data) => { console.log("sending event %s to machine with data %o", eventString, data) } // sending event to machine

  const histogram = function (selection) {
    selection.each(function () {
      const dom = d3.select(this)
      const svg = dom.append("svg")
        .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]);

      // add listeners for hover
      svg
        .on("mouseover", function () {
          onEvent("MOUSEOVER", { vis: visName, hoveredBin: binHovered });
        })
        .on("mouseout", function () {
          onEvent("MOUSEOUT");
        });

      const focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      updateData = function () {
        let bins = d3.bin()
          // max number of bins
          .thresholds(10)
          // domain
          .domain(d3.extent(data, d => d[columns[binIndex]]))
          // values
          .value(function (d) {
            let selected = true; // check if element is selected
            if (slideRange != null) {
              // if slide range has been changed, check within range
              if (slideRange != null) {
                selected = slideRange[0] <= d[columns[zIndex]] && slideRange[1] >= d[columns[zIndex]];
              }
            }
            if (selected) {
              return d[columns[binIndex]]
            }
          })
          // apply data to bins
          (data);

        // domains
        if (!init) {
          x.domain([bins[0].x0, bins[bins.length - 1].x1]);
          y.domain([0, d3.max(bins, d => d.length)]).nice();

          xAxis = d3.axisBottom(x)//.tickFormat(d => d / 1000 + "k");
          yAxis = d3.axisLeft(y)//.tickFormat(d => d);
          init = true;
        }

        focus.selectAll("rect")
          .data(bins)
          .join(
            enter => {
              enter
                .append("rect")
                .attr("fill", "steelblue")
                .attr("id", (_, i) => "bin" + i)
                .attr("x", d => x(d.x0) + 1)
                .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length))
                // hover
                .on("mouseover", function (event) {
                  binHovered = event.target.id;
                  focus.select(["#", event.target.id].join("")).attr("opacity", ".5");
                  onEvent("MOUSEOVER", { vis: visName, hoveredBin: binHovered });
                })
                .on("mouseout", function (event) {
                  binHovered = null;
                  focus.select(["#", event.target.id].join("")).attr("opacity", "1");
                  onEvent("MOUSEOUT", { hoveredBin: "" });
                })
                // click
                .on("click", function (event, d) {
                  let transition = svg.transition().duration(700).ease(d3.easeBackOut);
                  if (binSelected && binSelected == event.target.id) {
                    // if a selected bin has clicked, deselect it
                    binSelected = null;
                  }
                  else {
                    binSelected = event.target.id;
                  }

                  focus
                    .selectAll("rect")
                    .transition(transition)
                    .attr("fill", "steelblue");
                  binSelected != null && focus.select(["#", event.target.id].join("")).transition(transition).attr("fill", "lightgreen");
                  // trigger event
                  onEvent("CLICK", {selectedBin: binSelected});
                  // send bin range to app
                  onChange(binSelected != null ? [d.x0, d.x1] : null);
                })
            },
            update => {
              let transition = svg.transition().duration(700).ease(d3.easeBackOut);
              update
                .transition(transition)
                .attr("x", d => x(d.x0) + 1)
                .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
                .attr("y", d => y(d.length))
                .attr("height", d => y(0) - y(d.length))
            }
          );

        let yAxisSvg = focus.select("#axis--y"); // get y axis
        // first time: create it 
        if (yAxisSvg.empty()) {
          focus.append("g")
            .attr('id', "axis--y")
            .call(yAxis);
        }
        else {
          //let transition = svg.transition().duration(700).ease(d3.easeBackOut);
          // update it
          //yAxisSvg
          //  .transition(transition)
          //  .call(yAxis.scale(y))
        }
        // append axis to scatter
        if (focus.select("#axis--x").empty()) {
          focus.append("g")
            .attr('id', "axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

          // label y
          focus.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", - margin.left)
            .attr("x", - height / 2)
            .attr("dy", "1em")
            .attr("id", "axis--y--text")
            .style("text-anchor", "middle")
            .text("# of iris");
          // label x
          focus.append("text")
            .attr("transform",
              "translate(" + width / 2 + " ," +
              (y(0) + margin.bottom - margin.top) + ")")
            .style("text-anchor", "middle")
            .attr("id", "axis-x--text")
            .text(columns[binIndex]+" (cm)");
        }

      }
    })
  }

  histogram.data = function (newData) {
    if (!arguments.length) {
      return data;
    }
    data = newData;
    columns = data.columns;

    if (typeof updateData === 'function') {
      updateData()
    }
    return histogram
  }

  histogram.sliderRange = function (newRange) {
    slideRange = newRange;
    if (typeof updateData === 'function') {
      updateData()
    }
    return histogram
  }

  // bindings
  histogram.bindCallback = function (onChangeCallback, onEventCallback) {
    if (onChangeCallback) onChange = onChangeCallback;
    if (onEventCallback) onEvent = onEventCallback;
  }

  return histogram;
}