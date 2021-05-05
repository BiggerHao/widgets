import vegaViews from './../views/vega';
import * as vega from 'vega';

class D3Controller {

    constructor() {

        this.visNames = {
            scatter: "scatter",
            slider: "range",
            barchart: "barchart"
        }
        this.scatter = null;
        this.slider = null;
        this.histogram = null;

        this.drag = false;
        this.pan = false;

        this.hoveredVis = null;
        this.hoverBin = null;

        this.scale = 1;
    }

    setCustomScheme = function (scheme) {
        vega.scheme("custom", scheme);
    }

    getZoomObj = function (zoomScale, xDom, yDom) {
        return { zoomScale: zoomScale.toFixed(), panning: { x: [xDom[0].toFixed(3), xDom[1].toFixed(3)], y: [yDom[0].toFixed(3), yDom[1].toFixed(3)] }, visName: this.hoveredVis, hoveredBin: this.hoverBin }
    }

    getSliderRange = function (deltaL, deltaR) {
        // sort range
        let sliderRange = [deltaL, deltaR].sort((a, b) => a - b);
        // get range with only 1 fixed number 
        return [Number(sliderRange[0].toFixed(1)), Number(sliderRange[1].toFixed(1))];
    }

    createViews = function (scatterDiv, sliderDiv, histogramDiv, data, width) {
        this.slider = this.createVegaView(vegaViews.sliderVis, sliderDiv, width, 50, "irisData", data);
        this.scatter = this.createVegaView(vegaViews.scatterVis, scatterDiv, width, 300, "irisData", data);
        this.histogram = this.createVegaView(vegaViews.histogramVis, histogramDiv, width, 300, "irisData", data);
    }

    createVegaView = function (spec, div, width, height, dataName, data) {

        let view = new vega.View(vega.parse(spec), {
            renderer: 'canvas',  // renderer (canvas or svg)
            container: ['#', div].join(""),   // parent DOM container
            hover: true       // enable hover processing
        });

        view
            .insert(dataName, data)
            .width(width)
            .height(height);

        view.runAsync();

        return view;
    }

    bindCallbacks = function (eventCallback) {
        this.bindSliderCallback(eventCallback);
        this.bindHistogramCallback(eventCallback);
        this.bindScatterCallback(eventCallback);

        window.addEventListener("mousemove", ((event) => {
            if (this.drag) {
                // get data from slider 
                let deltaL = this.slider.signal("deltaL");
                let deltaR = this.slider.signal("deltaR");
                // update views
                let range = this.getSliderRange(deltaL, deltaR);
                this.scatter.signal("sliderRange", range);
                this.scatter.run();
                this.histogram.signal("sliderRange", range);
                this.histogram.run();
                // send event
                let slideObj = { range: { handleL: deltaL.toFixed(1), handleR: deltaR.toFixed(1), selectedRegion: range[1] - range[0] }, visName: this.hoveredVis, hoveredBin: this.hoverBin };
                eventCallback("MOUSEMOVE", slideObj);
            }
            // panning
            if (this.pan) {
                // get scatter portion && size
                let xDom = this.scatter.signal("xdom");
                let yDom = this.scatter.signal("ydom");
                //let zoomScale = this.scatter.signal("zoomScale");
                // upate view
                this.histogram.signal("scatterXRange", xDom);
                this.histogram.signal("scatterYRange", yDom);
                this.histogram.run();
                // send event
                eventCallback("MOUSEMOVE", this.getZoomObj(this.scale, xDom, yDom));
            }
        }).bind(this))
        // mouseup callback
        window.addEventListener("mouseup", (() => {
            if (this.pan || this.drag) {
                eventCallback("MOUSEUP");
                // check whether another vis/window is hovered 
                if ((this.drag && this.hoveredVis != this.visNames.range) || (this.pan && this.hoveredVis != this.visNames.scatter) || !this.hoveredVis) {
                    // trigger mouseout - mouseover events to reach the visualization
                    eventCallback("MOUSEOUT");
                    this.hoveredVis && eventCallback("MOUSEOVER", { vis: this.hoveredVis, hoveredBin: this.hoverBin });
                }
                this.pan = false;
                this.drag = false;
            }
        }).bind(this))
    }

    bindScatterCallback = function (eventCallback) {
        let visName = this.visNames.scatter;

        this.scatter.addEventListener("wheel", ((event, item) => {
            this.scale += (event.deltaY * -0.1)

            // get scatter portion && size
            let xDom = this.scatter.signal("xdom");
            let yDom = this.scatter.signal("ydom");
            //let zoomScale = this.scatter.signal("zoomScale");
            // update views
            this.histogram.signal("scatterXRange", xDom);
            this.histogram.signal("scatterYRange", yDom);
            this.histogram.run();
            // send event
            eventCallback("WHEEL", this.getZoomObj(this.scale, xDom, yDom));

        }).bind(this));

        this.scatter.addEventListener("mousedown", ((event, item) => {
            eventCallback("MOUSEDOWN");
            this.pan = true;
        }).bind(this));

        this.scatter.addEventListener("mouseover", ((event, item) => {
            this.hoveredVis = visName;
            !this.drag && !this.pan && eventCallback("MOUSEOVER", { vis: visName });
        }).bind(this));

        this.scatter.addEventListener("mouseout", ((event, item) => {
            this.hoveredVis = null;
            !this.drag && !this.pan && !item && eventCallback("MOUSEOUT");
        }).bind(this));
    }

    bindHistogramCallback = function (eventCallback) {
        let visName = this.visNames.barchart;
        let selectedBin = null;

        let getBinId = function (datum) {
            return datum ? Number(datum.bin0.toFixed(1)) : null;
        }

        let getBinRange = function (bin) {
            // sort range
            let binRange = [bin.bin0, bin.bin1].sort((a, b) => a - b);
            // get range with only 1 fixed number 
            return [Number(binRange[0].toFixed(1)), Number(binRange[1].toFixed(1))];
        }

        this.histogram.addEventListener("click", ((event, item) => {

            if (item && item.mark.marktype == "rect") {
                // bin has been clicked
                let bin = this.histogram.signal("selectedBin").bin;
                // update views
                this.scatter.signal("binRange", bin ? getBinRange(bin) : null);
                this.scatter.run();
                // set event obj
                selectedBin = !selectedBin ? JSON.stringify(getBinId(bin)) : null;
                // send event
                eventCallback("CLICK", { selectedBin: selectedBin });
            }

        }).bind(this));

        this.histogram.addEventListener("mouseover", ((event, item) => {
            this.hoveredVis = visName;
            if (item) {
                // bin has been hovered
                let currentBin = JSON.stringify(getBinId(item.datum));
                // update hover bin 
                this.hoverBin = currentBin;
                !this.drag && !this.pan && eventCallback("MOUSEOVER", { vis: visName, hoveredBin: currentBin });
            }
            else {
                !this.drag && !this.pan && eventCallback("MOUSEOVER", { vis: visName });
            }

        }).bind(this));

        this.histogram.addEventListener("mouseout", ((event, item) => {
            this.hoveredVis = null;
            if (item) {
                selectedBin = null;
                this.hoverBin = null;
                // mouseout from bin
                !this.drag && !this.pan && eventCallback("MOUSEOUT", { hoveredBin: null });
            }
            else {
                // mouseout from vis
                !this.drag && !this.pan && eventCallback("MOUSEOUT")
            }

        }).bind(this));
    }

    bindSliderCallback = function (eventCallback) {
        let visName = this.visNames.slider;

        this.slider.addEventListener("mousedown", ((event, item) => {
            if (!this.drag && item) {
                eventCallback("MOUSEDOWN");
                this.drag = true;
            }
        }).bind(this));


        this.slider.addEventListener("dblclick", (function (event, item) {

            if (item && item.mark && item.mark.marktype == "rect") {
                // get data from slider 
                let deltaL = this.slider.signal("deltaL");
                let deltaR = this.slider.signal("deltaR");
                // update views
                let range = this.getSliderRange(deltaL, deltaR);
                this.scatter.signal("sliderRange", range);
                this.scatter.run();
                this.histogram.signal("sliderRange", range);
                this.histogram.run();
                // send event
                let slideObj = { range: { handleL: deltaL.toFixed(1), handleR: deltaR.toFixed(1), selectedRegion: range[1] - range[0] } };
                eventCallback("DBLCLICK", slideObj);
            }
        }).bind(this));

        this.slider.addEventListener("mouseover", (function (event, item) {
            this.hoveredVis = visName;
            !this.drag && !this.pan && item && eventCallback("MOUSEOVER", { vis: visName });
        }).bind(this));

        this.slider.addEventListener("mouseout", (function (event, item) {
            this.hoveredVis = null;
            !this.drag && !this.pan && eventCallback("MOUSEOUT");
        }).bind(this));
    }
}

export default new D3Controller()