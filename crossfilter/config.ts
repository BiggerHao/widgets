import { Config } from "falcon-vis";
import { Renderers } from "vega";

export const config: Config = {
  //---------
  // features

  readyIndicator: false,
  chartCount: false,
  showUnfiltered: true,
  toggleUnfiltered: false,
  zeroD: "hbar",
  circleHeatmap: false,
  showInterestingness: false,
  progressiveInteractions: false,
  interpolate: false,
  zoom: false,
  renderer: "svg" as Renderers,

  //--------------
  // configuration

  maxInteractiveResolution1D: Infinity,
  maxInteractiveResolution2D: 80,

  barHeight: 200,
  barWidth: 350,
  histogramWidth: 350,
  heatmapWidth: 400,
  maxCircleSize: 800,
};
