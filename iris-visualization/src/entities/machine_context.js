export default class MachineContext {

    constructor(vis, hoveredBin, handleL, minL, handleR, maxR, selectedRegion, selectedBin, zoomScale, x, y) {
        this.vis = vis;
        this.hoveredBin = hoveredBin;
        this.range = {
            handleL: handleL,
            minL: minL,
            maxR: maxR,
            handleR: handleR,
            selectedRegion: selectedRegion
        };
        this.selectedBin = selectedBin;
        this.zoomScale = zoomScale;
        this.panning = {
            x: x,
            y: y
        }
    }

}

