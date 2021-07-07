import TransitionProbabilityGenerator from "./TransitionProbabilityGenerator";

main();

async function main() {
  const probabilityGenerator = new TransitionProbabilityGenerator();

  const pids = [
    "01a259b8-856e-48ae-92bd-fade80fa00c6",
    "0505add0-b02e-4730-8816-c6674a2a9b7b",
    "14278406-2491-438d-b3e0-80fc1fbcd1b3",
    "1d4cdb4f-febf-48f9-b778-8a95e47dd7df",
    "3e47ed06-11e9-412f-87f2-282a9d34679c",
    "5c0c08df-b704-4256-989a-082cbaaec984",
    "70f3f96b-730f-4733-bdb8-5fa2463693f0",
    "8076ab81-511f-456a-afc0-da6d5799b13b",
    "812ddf08-7783-49fb-ad52-350c8b9d4996",
    "a00979ec-95d3-412e-873c-8c01322432df",
  ];
  const dataset = "flights";
  const task = "4";

  for (const pid of pids) {
    console.log(`Processing ${pid}...`);

    const filename = `${pid}_${dataset}_${task}`;
    const state_filename = `../data/states/${pid}/${filename}.jsonl`;

    await probabilityGenerator.readTransitionFile(state_filename);
  }

  probabilityGenerator.generateTransitionProbabilities(
    "../data/probabilities/probabilities.json"
  );
}
