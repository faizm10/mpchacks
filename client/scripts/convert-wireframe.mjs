import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "components", "wireframe");

const primitiveExports = [
  "TLine", "TLines", "Ph", "WLabel", "B", "Notes", "Spec", "Frame",
  "Shell", "TopBits", "Panel", "Bars", "Stat", "NAV",
];

function stripGlobals(content) {
  return content
    .replace(/^\/\* global[\s\S]*?\*\/\n/m, "")
    .replace(/^const \{ useState[^}]+\} = React;\n/m, "")
    .replace(/\nObject\.assign\(window,[\s\S]*?\);\s*$/m, "");
}

function toPrimitives(content) {
  let body = stripGlobals(content);
  body = body.replace(/^function /gm, "export function ");
  return `'use client';\n\n// @ts-nocheck\nimport React from "react";\n\n${body.trim()}\n`;
}

function toSection(content, imports, exports, extra = "") {
  let body = stripGlobals(content);
  if (extra) body = extra + body;
  body = body.replace(/^function (Sec\w+)/gm, "export function $1");
  return `'use client';\n\nimport React${extra.includes("useState") ? ", { useState }" : ""} from "react";\nimport { ${imports.join(", ")} } from "./primitives";\n\n${body.trim()}\n`;
}

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "primitives.tsx"),
  toPrimitives(fs.readFileSync(path.join(root, "wf-primitives.jsx"), "utf8"))
);

const sections = [
  {
    src: "doc-sections.jsx",
    dest: "doc-sections.jsx",
    imports: ["Spec", "Frame", "Shell", "TopBits", "B", "Ph", "Panel"],
    exports: ["SecOverview", "SecAnalysis", "SecSitemap", "SecNav", "SecJourneys"],
  },
  {
    src: "screens-core.jsx",
    dest: "screens-core.jsx",
    imports: ["Spec", "Frame", "Shell", "TopBits", "B", "Ph", "Panel", "Bars", "Stat"],
    exports: ["SecAuth", "SecOnboarding", "SecDashboard", "SecAsk"],
    extra: "",
    transform: (body) => body.replace(/useStateCore/g, "useState"),
  },
  {
    src: "screens-features.jsx",
    dest: "screens-features.jsx",
    imports: ["Spec", "Frame", "Shell", "TopBits", "B", "Ph", "Panel", "Bars", "Stat"],
    exports: ["SecPolicy", "SecApprovals", "SecReports", "SecTransactions"],
  },
  {
    src: "screens-states.jsx",
    dest: "screens-states.jsx",
    imports: ["Spec", "Frame", "Shell", "TopBits", "B", "Ph", "Panel"],
    exports: ["SecNotifications", "SecSettings", "SecEmpty", "SecError"],
  },
];

for (const sec of sections) {
  let raw = fs.readFileSync(path.join(root, sec.src), "utf8");
  if (sec.transform) raw = sec.transform(raw);
  const needsUseState = raw.includes("useState");
  let body = stripGlobals(raw);
  if (sec.extra) body = sec.extra + body;
  body = body.replace(/^function (Sec\w+)/gm, "export function $1");
  const content = `'use client';\n\nimport React${needsUseState ? ", { useState }" : ""} from "react";\nimport { ${sec.imports.join(", ")} } from "./primitives";\n\n${body.trim()}\n`;
  fs.writeFileSync(path.join(outDir, sec.dest.replace(".tsx", ".jsx")), content);
}

console.log("Converted wireframe components to", outDir);
