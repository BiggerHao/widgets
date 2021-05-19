# D3_XState_Playground
The Iris Visualization is an example of a multi coordinate view realized with [Vega](https://vega.github.io/vega/) which has been modeled by an [XState State Chart](https://github.com/davidkpiano/xstate).

## Run the visualization

### Online Version

An online version of the visualization has been deployed on [Github Pages](https://giovfiordeponti.github.io/D3_XState_Playground/dist).

### Run Locally
* Windows only: run `npm install --global --production windows-build-tools` as Admin
* run `npm install`
* run `npm run build` (production purposes only)
* run `npm run start`

## Documentation

A brief document describing the visualization is available [here](https://github.com/GiovFiordeponti/D3_XState_Playground/blob/main/documentation.pdf).

### Demo Video

A video demonstration of the visualization environment and the corresponding XState model can be seen [here](https://youtu.be/3Ce3Srap2o8): the video show, for each visual component, the corresponding widget and all the different states that can be reached. In particular, the [XState Inspector](https://xstate.js.org/docs/packages/xstate-inspect/) shows (almost) in real-time the FSM state updates made by the user interaction.

### XState Chart

The corresponding FSM modeled through XState can be seen in the picture below:

![Model](https://github.com/GiovFiordeponti/D3_XState_Playground/blob/main/machine.png)

## Template

The application is built from a template realized by the [Sapienza Aware Group](https://github.com/aware-diag-sapienza/va-template/).


 

