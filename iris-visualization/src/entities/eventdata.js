export default class EventData {

    constructor({ vis = null, hoveredBin = null, handleL = null, handleR = null, selectedRegion = null, selectedBin = null, zoomScale = null, x = null, y = null}) {
        this.vis = vis;
        this.range = {
            handleL: handleL,
            handleR: handleR,
            selectedRegion: selectedRegion
        };
        this.hoveredBin = hoveredBin;
        this.selectedBin = selectedBin;
        this.zoomScale = zoomScale;
        this.panning = {
            x: x,
            y: y
        }
    }

}

