import assert from "node:assert/strict";
import { test } from "node:test";
import { checkContrastPairs } from "./contrast";

test("studio dark tokens pass AA for body text and button labels", () => {
  const findings = checkContrastPairs([
    { name: "text on background", foreground: "#F4F6FB", background: "#05070F", min: 4.5 },
    { name: "muted on background", foreground: "#9AA3B8", background: "#05070F", min: 4.5 },
    { name: "text on surface", foreground: "#F4F6FB", background: "#0C1224", min: 4.5 },
    { name: "accent ink on background", foreground: "#1678FF", background: "#05070F", min: 4.5 },
    { name: "button label on blue", foreground: "#001038", background: "#1678FF", min: 4.5 },
    { name: "button label on hover", foreground: "#001038", background: "#2D8CFF", min: 4.5 },
    { name: "danger on background", foreground: "#E06565", background: "#05070F", min: 4.5 },
    { name: "success on background", foreground: "#4DBA7A", background: "#05070F", min: 4.5 },
  ]);
  for (const finding of findings) {
    assert.equal(finding.pass, true, `${finding.name} ${finding.ratio?.toFixed(1)}:1`);
  }
});

test("public cinema tokens pass AA and do not use white on blue", () => {
  const findings = checkContrastPairs([
    { name: "text on background", foreground: "#F4F6FB", background: "#1A2033", min: 4.5 },
    { name: "muted on background", foreground: "#9AA3B8", background: "#1A2033", min: 4.5 },
    { name: "text on surface", foreground: "#F4F6FB", background: "#1E2538", min: 4.5 },
    { name: "muted on surface", foreground: "#9AA3B8", background: "#1E2538", min: 4.5 },
    { name: "accent ink on background", foreground: "#5AA3FF", background: "#1A2033", min: 4.5 },
    { name: "accent ink on surface", foreground: "#5AA3FF", background: "#1E2538", min: 4.5 },
    { name: "button label on blue", foreground: "#001038", background: "#1678FF", min: 4.5 },
    { name: "danger on background", foreground: "#E06565", background: "#1A2033", min: 4.5 },
    { name: "danger on surface", foreground: "#E06565", background: "#1E2538", min: 4.5 },
    { name: "success on background", foreground: "#4DBA7A", background: "#1A2033", min: 4.5 },
    { name: "overlay text", foreground: "#F4F6FB", background: "#001038", min: 4.5 },
    { name: "logo plate", foreground: "#001038", background: "#F4F6FB", min: 4.5 },
  ]);
  for (const finding of findings) {
    assert.equal(finding.pass, true, `${finding.name} ${finding.ratio?.toFixed(1)}:1`);
  }

  const forbidden = checkContrastPairs([
    { name: "white on blue", foreground: "#FFFFFF", background: "#1678FF", min: 4.5 },
    { name: "button blue as text on cinema", foreground: "#1678FF", background: "#1A2033", min: 4.5 },
  ]);
  assert.equal(forbidden[0]?.pass, false);
  assert.equal(forbidden[1]?.pass, false);
});

test("sales homepage tokens pass AA and do not use white on electric blue", () => {
  const findings = checkContrastPairs([
    { name: "text on navy", foreground: "#F7F8FC", background: "#071225", min: 4.5 },
    { name: "muted on navy", foreground: "#9AA3B8", background: "#071225", min: 4.5 },
    { name: "text on midnight", foreground: "#F7F8FC", background: "#0B1730", min: 4.5 },
    { name: "accent ink on navy", foreground: "#2787FF", background: "#071225", min: 4.5 },
    { name: "gradient end on navy", foreground: "#A78BFF", background: "#071225", min: 4.5 },
    { name: "button label on electric blue", foreground: "#001038", background: "#2787FF", min: 4.5 },
    { name: "button label on hover", foreground: "#001038", background: "#3D9AFF", min: 4.5 },
    { name: "ink on light", foreground: "#111A31", background: "#F7F8FC", min: 4.5 },
    { name: "ink on white", foreground: "#111A31", background: "#FFFFFF", min: 4.5 },
    { name: "muted on light", foreground: "#5A6480", background: "#F7F8FC", min: 4.5 },
    { name: "muted on white", foreground: "#5A6480", background: "#FFFFFF", min: 4.5 },
    { name: "viral button label", foreground: "#001038", background: "#B8A4FF", min: 4.5 },
  ]);
  for (const finding of findings) {
    assert.equal(finding.pass, true, `${finding.name} ${finding.ratio?.toFixed(1)}:1`);
  }

  const forbidden = checkContrastPairs([
    { name: "white on electric blue", foreground: "#FFFFFF", background: "#2787FF", min: 4.5 },
    { name: "violet as small text on navy", foreground: "#7657FF", background: "#071225", min: 4.5 },
  ]);
  assert.equal(forbidden[0]?.pass, false);
  assert.equal(forbidden[1]?.pass, false);
});

test("sales light sections use dark ink, not off-white on white", () => {
  const findings = checkContrastPairs([
    { name: "ink on light", foreground: "#111A31", background: "#F7F8FC", min: 4.5 },
    { name: "ink on white", foreground: "#111A31", background: "#FFFFFF", min: 4.5 },
    { name: "muted on light", foreground: "#5A6480", background: "#F7F8FC", min: 4.5 },
    { name: "muted on white", foreground: "#5A6480", background: "#FFFFFF", min: 4.5 },
    { name: "accent ink on light", foreground: "#0B5BD6", background: "#F7F8FC", min: 4.5 },
    { name: "accent ink on white", foreground: "#0B5BD6", background: "#FFFFFF", min: 4.5 },
    { name: "danger on light", foreground: "#B42318", background: "#F7F8FC", min: 4.5 },
    { name: "success on light", foreground: "#1B6B3C", background: "#F7F8FC", min: 4.5 },
    { name: "button label on blue", foreground: "#001038", background: "#2787FF", min: 4.5 },
  ]);
  for (const finding of findings) {
    assert.equal(finding.pass, true, `${finding.name} ${finding.ratio?.toFixed(1)}:1`);
  }

  const forbidden = checkContrastPairs([
    { name: "off-white on light", foreground: "#F7F8FC", background: "#F7F8FC", min: 4.5 },
    { name: "off-white on white", foreground: "#F7F8FC", background: "#FFFFFF", min: 4.5 },
    { name: "electric blue as small text on light", foreground: "#2787FF", background: "#F7F8FC", min: 4.5 },
  ]);
  assert.equal(forbidden[0]?.pass, false);
  assert.equal(forbidden[1]?.pass, false);
  assert.equal(forbidden[2]?.pass, false);
});
