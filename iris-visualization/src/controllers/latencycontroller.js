class LatencyController {
    constructor() {
        this.latencies = {};
        this.observer = new PerformanceObserver((function (list) {
            list.getEntries().forEach(entry => {
                if (entry.name != "START") {
                    if (!this.latencies[entry.name]) {
                        // if latency does not exist, create it
                        this.latencies[entry.name] = {
                            start: 0,
                            duration: 0,
                            latency: 0
                        };
                    }
                    if (entry.startTime != 0) {
                        this.latencies[entry.name].start = entry.startTime;
                    }
                    if (entry.duration != 0) {
                        this.latencies[entry.name].duration = entry.duration;
                    }
                }
            });
            Object.keys(this.latencies).forEach(event => {
                let eventData = this.latencies[event];
                eventData.latency = Math.abs(eventData.duration - eventData.start);
            });
        }).bind(this));
        // register observer for mark
        this.observer.observe({ entryTypes: ["measure", "mark"] });
        performance.mark("START")
    }
}

export default new LatencyController()