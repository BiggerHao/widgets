# XState Visualization
The _XState Visualization_ is an example of a _multi coordinate view_ realized with [Vega](https://vega.github.io/vega/) which has been modeled by an [XState State Chart](https://github.com/davidkpiano/xstate).

## Run the visualization

### Online Version

An online version of the visualization has been deployed on [Github Pages](https://giovfiordeponti.github.io/D3_XState_Playground/dist). Several version of the application with respect to a particular dataset have also been deployed:
* _Iris Dataset_: [XState](https://giovfiordeponti.github.io/D3_XState_Playground/dist/iris/xstate/)|[Vis](https://giovfiordeponti.github.io/D3_XState_Playground/dist/iris/vis/)
* _Heart Dataset_: [XState](https://giovfiordeponti.github.io/D3_XState_Playground/dist/heart/xstate/)|[Vis](https://giovfiordeponti.github.io/D3_XState_Playground/dist/heart/vis/)
* _Wine Dataset_: [XState](https://giovfiordeponti.github.io/D3_XState_Playground/dist/wine/xstate/)|[Vis](https://giovfiordeponti.github.io/D3_XState_Playground/dist/wine/vis/)

### Run Locally
* Windows only: run `npm install --global --production windows-build-tools` as Admin;
* run `npm install`;
* run `npm run build` to build the application, otherwise
* run `npm run autorun` if you want to build all the possible version of the application, or
* run `npm run start` for run a development server.

Available options for _build_/_start_ command: 
  * _app_: ```xstate```|```vis```
  * _dataset_: ```iris```|```wine```|```heart```

So the command will be something like the following:
```
npm run build|start -- --app=app_name --dataset=dataset_name
```

## Documentation

The repository has a [Wiki Page](https://github.com/GiovFiordeponti/D3_XState_Playground/wiki) describing implementation and design choices.

### Demo Video

A video demonstration of the visualization environment and the corresponding XState model can be seen [here](https://youtu.be/3Ce3Srap2o8): the video shows, for each visual component, the corresponding widget and all the different states that can be reached. In particular, the [XState Inspector](https://xstate.js.org/docs/packages/xstate-inspect/) shows (almost) in real-time the FSM state updates made by the user interaction.

### XState Chart

The corresponding FSM modeled through XState can be seen in the picture below:

![Model](https://github.com/GiovFiordeponti/D3_XState_Playground/blob/main/images/machine.png)

## Template

The application is built from a template realized by the [Sapienza Aware Group](https://github.com/aware-diag-sapienza/va-template/).


 

