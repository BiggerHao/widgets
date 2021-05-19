import vegaViews from './../views/vega';
import * as vega from 'vega';
import consts from './../consts';
import entities from '../entities';

let events = consts.events;
let viewFields = consts.fields;

class D3Controller {

    constructor() {

        this.visNames = consts.vis;
        this.scatter = null;
        this.slider = null;
        this.histogram = null;

        this.rangeScale = null;

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
        return { zoomScale: Number(zoomScale.toFixed()), x: [Number(xDom[0].toFixed(3)), Number(xDom[1].toFixed(3))], y: [Number(yDom[0].toFixed(3)), Number(yDom[1].toFixed(3))], vis: this.hoveredVis, hoveredBin: this.hoverBin }
    }

    getSliderRange = function (deltaL, deltaR) {
        // sort range
        let sliderRange = [deltaL, deltaR].sort((a, b) => a - b);
        // get range with only 1 fixed number 
        return [Number(sliderRange[0].toFixed(1)), Number(sliderRange[1].toFixed(1))];
    }

    /**
     * 
     * @returns {MachineContext}
     */
    getMachineContext = function () {
        let context = new entities.MachineContext();
        // range slider context
        let deltaL = this.rangeScale.invert(this.slider.signal("deltaL"));
        let deltaR = this.rangeScale.invert(this.slider.signal("deltaR"));
        context.range.handleL = Number(deltaL.toFixed(1));
        context.range.minL = context.range.handleL;
        context.range.handleR = Number(deltaR.toFixed(1));
        context.range.maxR = context.range.handleR;
        context.range.selectedRegion = deltaR.toFixed(1) - deltaL.toFixed(1);
        // scatter
        let xDom = this.scatter.signal("xdom");
        let yDom = this.scatter.signal("ydom");
        context.panning.x = xDom;
        context.panning.y = yDom;
        context.zoomScale = 1;
        return context;
    }

    createViews = function (scatterDiv, sliderDiv, histogramDiv, data, fields, labels, dataSize, width) {
        // create bin field 
        data.forEach(d => {
            if (d[fields[viewFields.binField]] && d[fields[viewFields.rangeField]] && d[fields[viewFields.xField]] && d[fields[viewFields.yField]] && d[fields[viewFields.colorField]]) {
                d[viewFields.binField] = d[fields[viewFields.binField]];
                d[viewFields.rangeField] = d[fields[viewFields.rangeField]];
                d[viewFields.xField] = d[fields[viewFields.xField]];
                d[viewFields.yField] = d[fields[viewFields.yField]];
                d[viewFields.colorField] = d[fields[viewFields.colorField]];
            }
        })
        this.slider = this.createVegaView(vegaViews.sliderVis, sliderDiv, width, 50, data);
        this.slider
            .signal("rangeLabel", labels["rangeLabel"])
            .runAsync();

        this.rangeScale = this.slider.scale("x");

        this.scatter = this.createVegaView(vegaViews.scatterVis, scatterDiv, width, 300, data);
        this.scatter
            .signal("xLabel", labels["scatterXLabel"])
            .signal("yLabel", labels["scatterYLabel"])
            .signal("colorLabel", labels["colorLabel"])
            .signal("dataSize", dataSize)
            .runAsync();

        this.histogram = this.createVegaView(vegaViews.histogramVis, histogramDiv, width, 300, data);
        this.histogram
            .signal("xLabel", labels["binXLabel"])
            .signal("yLabel", labels["binYLabel"])
            .runAsync();
    }

    createVegaView = function (spec, div, width, height, data) {
        let view = new vega.View(vega.parse(spec), {
            renderer: 'canvas',  // renderer (canvas or svg)
            container: ['#', div].join(""),   // parent DOM container
            hover: true       // enable hover processing
        });

        view
            .insert("dataset", data)
            .width(width)
            .height(height);

        return view;
    }

    bindCallbacks = function (eventCallback) {
        if (!eventCallback) {
            eventCallback = (eventString, data) => { console.log("received event %s with data %o", eventString, data) }
        }
        this.bindSliderCallback(eventCallback);
        this.bindHistogramCallback(eventCallback);
        this.bindScatterCallback(eventCallback);

        window.addEventListener("mousemove", ((event) => {
            if (this.drag) {
                // get data from slider 
                let deltaL = this.rangeScale.invert(this.slider.signal("deltaL"));
                let deltaR = this.rangeScale.invert(this.slider.signal("deltaR"));
                // update views
                let range = this.getSliderRange(deltaL, deltaR);
                this.scatter.signal("sliderRange", range);
                this.scatter.run();
                this.histogram.signal("sliderRange", range);
                this.histogram.run();
                // send event
                let slideObj = { handleL: Number(deltaL.toFixed(1)), handleR: Number(deltaR.toFixed(1)), selectedRegion: range[1] - range[0], vis: this.hoveredVis, hoveredBin: this.hoverBin };
                eventCallback(events.MOUSEMOVE, new entities.EventData(slideObj));
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
                eventCallback(events.MOUSEMOVE, new entities.EventData(this.getZoomObj(this.scale, xDom, yDom)));
            }
        }).bind(this))
        // mouseup callback
        window.addEventListener("mouseup", (() => {
            if (this.pan || this.drag) {
                eventCallback(events.MOUSEUP);
                // check whether another vis/window is hovered 
                if ((this.drag && this.hoveredVis != this.visNames.range) || (this.pan && this.hoveredVis != this.visNames.scatter) || !this.hoveredVis) {
                    // trigger mouseout - mouseover events to reach the visualization
                    eventCallback(events.MOUSEOUT);
                    this.hoveredVis && eventCallback(events.MOUSEOVER, new entities.EventData({
                        vis: this.hoveredVis,
                        hoveredBin: this.hoverBin
                    }));
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
            eventCallback(events.WHEEL, new entities.EventData(this.getZoomObj(this.scale, xDom, yDom)));

        }).bind(this));

        this.scatter.addEventListener("mousedown", ((event, item) => {
            eventCallback(events.MOUSEDOWN);
            this.pan = true;
        }).bind(this));

        this.scatter.addEventListener("mouseover", ((event, item) => {
            this.hoveredVis = visName;
            !this.drag && !this.pan && eventCallback(events.MOUSEOVER, new entities.EventData({ vis: visName }));
        }).bind(this));

        this.scatter.addEventListener("mouseout", ((event, item) => {
            this.hoveredVis = null;
            !this.drag && !this.pan && !item && eventCallback(events.MOUSEOUT);
        }).bind(this));
    }

    bindHistogramCallback = function (eventCallback) {
        let visName = this.visNames.barchart;
        let selectedBin = null;

        let getBinId = function (datum) {
            return datum ? `${datum.bin0.toFixed(1)}-${datum.bin1.toFixed(1)}` : null;
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
                eventCallback(events.CLICK, new entities.EventData({ selectedBin: selectedBin }));
            }

        }).bind(this));

        this.histogram.addEventListener("mouseover", ((event, item) => {
            this.hoveredVis = visName;
            if (item) {
                // bin has been hovered
                let currentBin = JSON.stringify(getBinId(item.datum));
                // update hover bin 
                this.hoverBin = currentBin;
                !this.drag && !this.pan && eventCallback(events.MOUSEOVER, new entities.EventData({ vis: visName, hoveredBin: currentBin }));
            }
            else {
                !this.drag && !this.pan && eventCallback(events.MOUSEOVER, new entities.EventData({ vis: visName }));
            }

        }).bind(this));

        this.histogram.addEventListener("mouseout", ((event, item) => {
            this.hoveredVis = null;
            if (item) {
                selectedBin = null;
                this.hoverBin = null;
                // mouseout from bin
                !this.drag && !this.pan && eventCallback(events.MOUSEOUT, new entities.EventData({ hoveredBin: null }));
            }
            else {
                // mouseout from vis
                !this.drag && !this.pan && eventCallback(events.MOUSEOUT)
            }

        }).bind(this));
    }

    bindSliderCallback = function (eventCallback) {
        let visName = this.visNames.slider;

        this.slider.addEventListener("mousedown", ((event, item) => {
            if (!this.drag && item) {
                eventCallback(events.MOUSEDOWN);
                this.drag = true;
            }
        }).bind(this));


        this.slider.addEventListener("dblclick", (function (event, item) {

            if (item && item.mark && item.mark.marktype == "rect") {
                // get data from slider 
                let deltaL = this.rangeScale.invert(this.slider.signal("deltaL"));
                let deltaR = this.rangeScale.invert(this.slider.signal("deltaR"));
                // update views
                let range = this.getSliderRange(deltaL, deltaR);
                this.scatter.signal("sliderRange", range);
                this.scatter.run();
                this.histogram.signal("sliderRange", range);
                this.histogram.run();
                // send event
                let slideObj = { range: { handleL: deltaL.toFixed(1), handleR: deltaR.toFixed(1), selectedRegion: range[1] - range[0] } };
                eventCallback(events.DBLCLICK, new entities.EventData(slideObj));
            }
        }).bind(this));

        this.slider.addEventListener("mouseover", (function (_, item) {
            this.hoveredVis = visName;
            !this.drag && !this.pan && item && eventCallback(events.MOUSEOVER, new entities.EventData({ vis: visName }));
        }).bind(this));

        this.slider.addEventListener("mouseout", (function (event, item) {
            this.hoveredVis = null;
            !this.drag && !this.pan && eventCallback(events.MOUSEOUT);
        }).bind(this));
    }
}

export default new D3Controller()