exports.createLiElement = function (div, keyString, valueString, subValueString) {
    let li = document.createElement("li");
    let key = document.createElement("strong");
    key.textContent = keyString;
    key.className = "machine";
    li.appendChild(key);
    let value = document.createElement("p");
    value.textContent = valueString;
    value.className = "machine";
    li.appendChild(value);
    if (subValueString) {
        let subValue = document.createElement("small");
        subValue.textContent = subValueString;
        subValue.className = "machine";
        li.appendChild(subValue);
    }
    div.appendChild(li);
}

exports.printNextStates = function (predictiveStep, latencies, domElement, isFlex) {

    let unList = document.createElement("ul");
    predictiveStep.forEach(step => {

        if (isFlex) {
            unList.className = "box";
        }
        let info = "(cond: " + (step.target.cond != "" ? step.target.cond : "none");
        // add latency
        info += step.target.event != "" ? ", lat: " + (latencies[step.target.event] ? latencies[step.target.event].latency : 0) + " ms)" : ")";
        this.createLiElement(
            unList, step.target.destination,
            step.target.event != "" ? "with " + step.target.event : "eventless",
            info
        );
        if (step.child && step.child.length > 0) {
            this.printNextStates(step.child, latencies, unList, true);
        }

    })
    domElement.appendChild(unList);
}

exports.printNextQueries = function (futureQueries, domElement, isFlex = false) {

    let unList = document.createElement("ul");
    Object.keys(futureQueries).forEach(queryId => {
        if (isFlex) {
            unList.className = "box";
        }

        let futureQuery = futureQueries[queryId];
        if (!futureQuery.sql) {
            // obj contains delta queries, rerun alg
            this.createLiElement(unList, `${queryId}: `);
            this.printNextQueries(futureQuery, unList, true);
        }
        else {
            // simple query, print it
            let query = futureQuery.sql;
            this.createLiElement(
                unList, `${queryId}: `,
                query,
                null
            );
        }
    })
    domElement.appendChild(unList);
}

/**
 * @deprecated
 * @param {*} futureStates 
 */
exports.printAvailableTransition = function (futureStates, domElement) {
    // first: clear html

    // for each transition, get corresponding obj and append it to a LI element
    Object.keys(futureStates).forEach(transition => {
        let futureState = futureStates[transition];
        createLiElement(domElement, (transition != "" ? transition : "always") + ": ", JSON.stringify(futureState), latencies[transition] ? "(" + latencies[transition].latency + " ms)" : "")
    })
}

exports.printState = function (stateValue) {
    return typeof stateValue === "string" ? stateValue : JSON.stringify(stateValue);
}

exports.printTime = function (ts) {
    return new Date(ts).toTimeString().split(' ')[0]
}