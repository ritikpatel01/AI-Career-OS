import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { buildRoadmapPracticeCoverage } from "../src/data/careerRoadmaps/roadmapPracticeCoverage.js";

const outputPath = resolve("src/data/careerRoadmaps/roadmapPracticeCoverage.json");
const report = buildRoadmapPracticeCoverage();
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.totals, null, 2));
