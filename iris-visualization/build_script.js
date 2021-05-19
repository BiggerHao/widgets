const modes = ["vis", "xstate"];
const datasets = ["iris", "wine", "heart"];

const execSync = require('child_process').execSync;

function exec(command) {
    const output = execSync(command, { encoding: 'utf-8' });  // the default is 'buffer'
    console.log('Output was:\n', output);
}
console.log("creating dev environment...")
exec(`npm run build`);
datasets.forEach(dataset => {
    modes.forEach(mode => {
        console.log("creating environment %s for dataset %s", mode, dataset);
        // import { execSync } from 'child_process';  // replace ^ if using ES modules
        exec(`npm run build -- --app=${mode} --dataset=${dataset}`)
    })
});

