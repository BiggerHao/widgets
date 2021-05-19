import 'normalize.css'
import './index.scss'
import app from './app';
import { inspect } from '@xstate/inspect';
import modes from './consts/modes'
const {
    MODE_DEV,
    MODE_VIS,
    MODE_XSTATE
} = modes
const {
    APP_MODE,
    APP_DATASET
} = process.env;

function hideMenu() {
    arrow.hidden = true;
    menubutton.hidden = true;
    titleVis.hidden = false;
    dashboard.hidden = true;
    queryDashboard.hidden = true;
}

function setSwitch(domElement, storageElement, callback) {
    domElement.checked = localStorage.getItem(storageElement) != null ? localStorage.getItem(storageElement) === "true" : true;
    domElement.addEventListener("change", (() => callback()).bind(this));
}
// if we are in dev mode, retrieve dataset from storage, otherwise from env file
let selectedDataset = APP_MODE == MODE_DEV ? (localStorage.getItem("selectedDataset") || "iris") : APP_DATASET;
let useMachine = true;
let useInspector = false;
let useQuery = false;
switch (APP_MODE) {
    // dev mode: menu to switch datasets, dashboard + inspector
    case MODE_DEV:

        titleVis.hidden = true;
        let coll = document.getElementsByClassName("collapsible");
        for (let i = 0; i < coll.length; i++) {
            coll[i].addEventListener("click", function () {
                this.classList.toggle("active");
                let content = this.nextElementSibling;
                let arrow = document.getElementById("arrow");
                if (content.style.display === "block") {
                    content.style.display = "none";
                    arrow.innerHTML = "&darr;";
                } else {
                    content.style.display = "block";
                    arrow.innerHTML = "&uarr;";
                }
            });
        }
        // query dashboard switch
        setSwitch(queryDashboardSwitch, "queryDashboard", () => {
            queryDashboard.hidden = !queryDashboard.hidden;
            localStorage.setItem("queryDashboard", queryDashboardSwitch.checked);
        })
        queryDashboard.hidden = !queryDashboardSwitch.checked;
        // dashboard switch
        setSwitch(dashboardSwitch, "dashboard", () => {
            dashboard.hidden = !dashboard.hidden;
            localStorage.setItem("dashboard", dashboardSwitch.checked);
        })
        dashboard.hidden = !dashboardSwitch.checked;
        // inspector switch
        setSwitch(inspectorSwitch, "inspector", () => {
            localStorage.setItem("inspector", inspectorSwitch.checked);
        });
        useInspector = inspectorSwitch.checked;
        if (useInspector) {
            // add inspector
            inspect({
                // options
                url: 'https://statecharts.io/inspect', // (default)
                iframe: false // open in new window
            });
        }
        // xstate switch
        setSwitch(xstateSwitch, "xstate", () => {
            localStorage.setItem("xstate", xstateSwitch.checked);
            useMachine = !useMachine;
            app(selectedDataset, useMachine, useInspector, useQuery);
        });
        useMachine = xstateSwitch.checked;
        // query switch
        setSwitch(querySwitch, "query", () => {
            localStorage.setItem("query", querySwitch.checked);
            useQuery = !useQuery;
            app(selectedDataset, useMachine, useInspector, useQuery);
        });
        useQuery = querySwitch.checked;
        // datasets
        let datasetRadios = document.querySelectorAll('input[type=radio][name="datasets"]');
        datasetRadios.forEach((radio) => {
            if (radio.id == selectedDataset) {
                radio.checked = true;
            }
            radio.addEventListener('change', (function () {
                selectedDataset = radio.id;
                localStorage.setItem("selectedDataset", selectedDataset);
                app(selectedDataset, useMachine, useInspector, useQuery);
            }).bind(this))
        })
        break;
    case MODE_VIS:
        hideMenu();
        useMachine = false;
        useQuery = false;
        break;
    case MODE_XSTATE:
        hideMenu();
        useMachine = true;
        useQuery = true;
        break;
}

loading.hidden = true;
page.hidden = false;
app(selectedDataset, useMachine, useInspector, useQuery);