import d3Views from './../views/d3';
import * as d3 from 'd3';

class D3Controller {
    constructor() {
        // data index
        let xIndex = 0//5;
        let yIndex = 1//2;
        let zIndex = 2//3;
        let binIndex = 3//6;
        // default width
        let width = 450;

        this.scatter = d3Views.scatter(width, xIndex, yIndex, zIndex, binIndex);
        this.slider = d3Views.slider(width, zIndex);
        this.histogram = d3Views.histogram(width, binIndex, zIndex);
    }

    bindData(data, eventCallback) {
        // first: select divs and call view
        d3.select("#scatter_d3_div").call(this.scatter);
        d3.select("#histogram_d3_div").call(this.histogram);
        d3.select("#slider_d3_div").call(this.slider);
        // send data to vis
        this.scatter.data(data);
        this.slider.data(data);
        this.histogram.data(data);
        // bind callbacks
        this.slider.bindCallback(this.updateRange.bind(this), eventCallback);
        this.scatter.bindCallback(this.updateScale.bind(this), eventCallback);
        this.histogram.bindCallback(this.updateBin.bind(this), eventCallback);
    }

    getCustomScheme = function(){
        return d3.schemeCategory10.slice(1);
    }

    loadData = async function (dataPath) {
        return new Promise((resolve, reject) => {
            //The format in the json, which d3 will read
            d3.csv(dataPath)
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    updateRange = function (valueL, valueR) {
        this.scatter.sliderRange(d3.extent([valueL, valueR]));
        this.histogram.sliderRange(d3.extent([valueL, valueR]));
    }

    updateScale = function (scale) {
        this.slider.scale(scale);
    }

    updateBin = function (binScale) {
        this.scatter.binsRange(binScale);
    }
}

export default new D3Controller()