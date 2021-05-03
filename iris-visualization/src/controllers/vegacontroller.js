import vegaViews from './../views/vega';
import * as vega from 'vega';

class D3Controller {
    constructor() {

        this.scatter = null;
        this.slider = null;
        this.histogram = null;

        this.drag = false;
        this.pan = false;
    }

    setCustomScheme = function (scheme) {
        vega.scheme("custom", scheme);
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
    }

    bindScatterCallback = function (eventCallback) {
        let visName = "scatter";
        let scale = 1;

        let getZoomObj = function (zoomScale, xDom, yDom) {
            return { zoomScale: zoomScale.toFixed(), panning: { x: [xDom[0].toFixed(1), xDom[1].toFixed(1)], y: [yDom[0].toFixed(1), yDom[1].toFixed(1)] } }
        }

        this.scatter.addEventListener("wheel", ((event, item) => {
            scale += (event.deltaY * -0.1)

            console.log(scale);
            // get scatter portion && size
            let xDom = this.scatter.signal("xdom");
            let yDom = this.scatter.signal("ydom");
            //let zoomScale = this.scatter.signal("zoomScale");
            // update views
            this.histogram.signal("scatterXRange", xDom);
            this.histogram.signal("scatterYRange", yDom);
            this.histogram.run();
            // send event
            eventCallback("WHEEL", getZoomObj(scale, xDom, yDom));

        }).bind(this));

        this.scatter.addEventListener("mousedown", ((event, item) => {
            eventCallback("MOUSEDOWN");
            this.pan = true;
        }).bind(this));

        this.scatter.addEventListener("mouseup", ((event, item) => {
            if (this.pan) {
                eventCallback("MOUSEUP");
            }
            this.pan = false;
        }).bind(this));

        this.scatter.addEventListener("mousemove", (function (event, item) {
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
                eventCallback("MOUSEMOVE", getZoomObj(scale, xDom, yDom));
            }

        }).bind(this));

        this.scatter.addEventListener("mouseover", function (event, item) {
            eventCallback("MOUSEOVER", { vis: visName });
        });

        this.scatter.addEventListener("mouseout", function (event, item) {
            !item && eventCallback("MOUSEOUT");
        });
    }

    bindHistogramCallback = function (eventCallback) {
        let visName = "barchart";
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

        this.histogram.addEventListener("mouseover", function (event, item) {
            if (item) {
                let currentBin = JSON.stringify(getBinId(item.datum));
                // bin has been hovered
                eventCallback("MOUSEOVER", { vis: visName, hoveredBin: currentBin });
            }
            else {
                eventCallback("MOUSEOVER", { vis: visName });
            }

        });

        this.histogram.addEventListener("mouseout", function (event, item) {

            if (item) {
                selectedBin = null;
                // mouseout from bin
                eventCallback("MOUSEOUT", { hoveredBin: null });
            }
            else {
                // mouseout from vis
                eventCallback("MOUSEOUT")
            }

        });
    }

    bindSliderCallback = function (eventCallback) {
        let visName = "range";

        let getSliderRange = function (deltaL, deltaR) {
            // sort range
            let sliderRange = [deltaL, deltaR].sort((a, b) => a - b);
            // get range with only 1 fixed number 
            return [Number(sliderRange[0].toFixed(1)), Number(sliderRange[1].toFixed(1))];
        }

        this.slider.addEventListener("mousedown", ((event, item) => {
            if (!this.drag && item) {
                eventCallback("MOUSEDOWN");
                this.drag = true;
            }
        }).bind(this));

        this.slider.addEventListener("mouseup", ((event, item) => {
            eventCallback("MOUSEUP");
            this.drag = false;
        }).bind(this));

        this.slider.addEventListener("mousemove", (function (event, item) {
            if (this.drag) {
                // get data from slider 
                let deltaL = this.slider.signal("deltaL");
                let deltaR = this.slider.signal("deltaR");
                // update views
                let range = getSliderRange(deltaL, deltaR);
                this.scatter.signal("sliderRange", range);
                this.scatter.run();
                this.histogram.signal("sliderRange", range);
                this.histogram.run();
                // send event
                let slideObj = { range: { handleL: deltaL.toFixed(1), handleR: deltaR.toFixed(1), selectedRegion: range[1] - range[0] } };
                eventCallback("MOUSEMOVE", slideObj);
            }
        }).bind(this));

        this.slider.addEventListener("mouseover", function (event, item) {
            item && eventCallback("MOUSEOVER", { vis: visName });
        });

        this.slider.addEventListener("mouseout", function (event, item) {
            eventCallback("MOUSEOUT");
        });
    }
}

export default new D3Controller()