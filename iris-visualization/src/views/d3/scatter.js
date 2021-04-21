import * as d3 from 'd3';

export default function (w, xIndex, yIndex, zIndex, binIndex) {
  let visName = "scatter";

  let data = [];
  let columns = [];
  let slideRange, binRange = null;
  
  let currentScale, currentPanning = 0;
  let isPanning = false; // check whether user is panning or not

  let updateData, zoomed, zoom;

  let keys = ["Versicolor", "Setosa", "Virginica"];
  let color = d3.scaleOrdinal(keys, d3.schemeCategory10.slice(1, 4));
  console.log(d3.schemeCategory10.slice(1, 4))

  let width = w, height = 230;
  let margin = { top: 15, right: 80, bottom: 30, left: 80 };


  let x = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

  let xAxis, yAxis = null;

  let zoomMode = false;

  // callbacks
  let onChange = (scale) => { console.log("received scale %o ", scale) } // default callback when data is brushed
  let onEvent = (eventString, data) => { console.log("sending event %s to machine with data %o", eventString, data) } // sending event to machine

  let createLegend = function(svg){
    // Add one dot in the legend for each name.
    let size = 10
    svg.selectAll("mydots")
      .data(keys)
      .enter()
      .append("rect")
      .attr("x", width)
      .attr("y", function (_, i) { return i * (size + 5) }) // 100 is where the first dot appears. 25 is the distance between dots
      .attr("width", size)
      .attr("height", size)
      .style("fill", function (d) { return color(d) })

    // Add one dot in the legend for each name.
    svg.selectAll("mylabels")
      .data(keys)
      .enter()
      .append("text")
      .attr("x", width + size * 1.2)
      .attr("y", function (_, i) { return i * (size + 5) + (size / 2) + 5 }) // 100 is where the first dot appears. 25 is the distance between dots
      .style("fill", function (d) { return color(d) })
      .text(function (d) { return d })
      .attr("text-anchor", "left")
      .style("alignment-baseline", "middle")
  }
  const scatter = function (selection) {
    selection.each(function () {
      const dom = d3.select(this)
      const svg = dom.append("svg")
        .attr("viewBox", [0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom]);

      svg.append("defs").append("clipPath")
        .attr("id", "clipScatter")
        .append("rect")
        .attr("x", -margin.left / 4)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

      // add listeners for hover
      svg
        .on("mouseover", function () {
          onEvent("MOUSEOVER", { vis: visName });
        })
        .on("mouseout", function () {
          onEvent("MOUSEOUT");
        });

      const focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      updateData = function () {
        // domains
        if (!zoomMode) {
          x.domain(d3.extent(data, d => +d[columns[xIndex]])).nice();
          y.domain(d3.extent(data, d => +d[columns[yIndex]])).nice();

          xAxis = d3
            .axisBottom(x)
          //.tickFormat(d => d / 1000 + "k");
          yAxis = d3
            .axisLeft(y)
          //.tickFormat(d => d / 1000 + "k");
        }

        zoomed = function ({ transform, target, type }) {
          if(currentScale == transform.k){
            isPanning = true;
          }
          // get scale and panning
          currentScale = transform.k;
          currentPanning = transform.x;
          // set zoom mode
          zoomMode = true;
          let transition = svg.transition().duration(100);
          let newX = transform.rescaleX(x).nice();
          let newY = y.copy(); //transform.rescaleY(y).nice();
          onEvent("MOUSEMOVE", { zoomScale: transform.k, panning: transform.x });
          svg.select("#axis--x")
            .transition(transition)
            .call(xAxis.scale(newX));
          //svg.select("#axis--y")
          //  .transition(transition)
          //  .call(yAxis.scale(newY));

          focus.selectAll("#dots").transition(transition)
            .attr("cx", function (d) { return newX(d[columns[xIndex]]) })
            .attr("cy", function (d) { return newY(d[columns[yIndex]]) })
        }


        focus.selectAll(".dot").remove();
        focus.selectAll("#dots")
          .data(data)
          .join(
            enter => {
              enter
                .append("circle")
                .attr("id", "dots")
                //.attr("clip-path", "url(#clipScatter)")
                .attr("r", 5)
                .style("fill", d => color(d.variety))
                .attr("stroke", "black")
                .attr("stroke-width", "1")
                .attr("cx", function (d) { return x(d[columns[xIndex]]) })
                .attr("cy", function (d) { return y(d[columns[yIndex]]) })
            },
            update => {
              update
                .attr("opacity", function (d) {
                  let selected = true;
                  // check both slide range and bin range
                  if (slideRange != null && binRange != null) {
                    selected = (slideRange[0] <= d[columns[zIndex]] && slideRange[1] >= d[columns[zIndex]])
                      && (binRange[0] <= d[columns[binIndex]] && binRange[1] >= d[columns[binIndex]]);
                  }
                  // check slider range
                  else if (slideRange != null) {
                    selected = slideRange[0] <= d[columns[zIndex]] && slideRange[1] >= d[columns[zIndex]];
                  }
                  // check bin range
                  else if (binRange != null) {
                    selected = binRange[0] <= d[columns[binIndex]] && binRange[1] >= d[columns[binIndex]];
                  }
                  return selected ? "1" : "0";
                })
            }
          );

        if (!zoom) {
          zoom = d3.zoom()
            .scaleExtent([.5, 40])
            .extent([[0, 0], [width, height]])
            .on("zoom", zoomed)
            .on("end", function(){
              isPanning && onEvent("MOUSEUP");
              isPanning = false;
            });

          svg.call(zoom)//.call(zoom.transform, d3.zoomIdentity);
        }


        // append axis to scatter
        if (focus.select("#axis--x").empty()) {
          focus.append("g")
            .attr('id', "axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);
          focus.append("g")
            .attr('id', "axis--y")
            //.attr("transform", "translate(" + x(0) + ", 0)")
            .call(yAxis);
          // label y
          focus.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", - margin.left)
            .attr("x", - height / 2)
            .attr("dy", "1em")
            .attr("id", "axis--y--text")
            .style("text-anchor", "middle")
            .text(columns[yIndex] + " (cm)");
          // label x
          focus.append("text")
            .attr("transform",
              "translate(" + width / 2 + " ," + (height + margin.bottom) + ")")
            .style("text-anchor", "middle")
            .attr("id", "axis-x--text")
            .text(columns[xIndex] + " (cm)");
          createLegend(focus);
        }
      }
    })
  }

  scatter.data = function (newData) {
    if (!arguments.length) {
      return data;
    }
    data = newData;
    columns = data.columns;

    if (typeof updateData === 'function') {
      updateData()
    }
    return scatter
  }

  scatter.sliderRange = function (newRange) {

    slideRange = newRange;
    if (typeof updateData === 'function') {
      updateData()
    }
    return scatter
  }

  scatter.binsRange = function (newRange) {
    binRange = newRange;
    if (typeof updateData === 'function') {
      updateData()
    }
    return scatter
  }

  // bindings
  scatter.bindCallback = function (onChangeCallback, onEventCallback) {
    if (onChangeCallback) onChange = onChangeCallback;
    if (onEventCallback) onEvent = onEventCallback;
  }

  return scatter;
}