import type { CreativeBrief, ConceptScene, CreativeConcept, CreativeDirectorProvider } from "./types";

function sceneWindows(durationSeconds: number): Array<[number, number]> {
  if (durationSeconds <= 10) {
    return [
      [0, 3],
      [3, 7],
      [7, 10],
    ];
  }
  if (durationSeconds <= 15) {
    return [
      [0, 5],
      [5, 10],
      [10, 15],
    ];
  }
  if (durationSeconds <= 20) {
    return [
      [0, 5],
      [5, 12],
      [12, 20],
    ];
  }
  return [
    [0, 5],
    [5, 11],
    [11, 18],
    [18, 25],
    [25, 30],
  ];
}

function sceneCopy(
  input: CreativeBrief,
  index: number,
  total: number,
): { visual: string; dialogue: string; presenterAction: string; camera: string; audio: string } {
  const name = input.businessName;
  const action = input.ctaType.toLowerCase();
  if (index === 0) {
    return {
      visual: `Open on the presenter for ${name} in a real ${input.strategy.label.toLowerCase()} setting.`,
      dialogue: input.problem
        ? `If ${input.targetCustomer || "you"} are dealing with ${input.problem.toLowerCase()}, this is for you.`
        : `If you need a clearer way forward, ${name} is here to help.`,
      presenterAction: "Look to camera and speak with calm confidence.",
      camera: "Slow push-in, eye level.",
      audio: "Quiet room tone under a clear voice.",
    };
  }
  if (index === total - 1) {
    const detail = input.ctaValue ? ` ${input.ctaValue}` : "";
    return {
      visual: `Close on the presenter with space for the brand to be added later.`,
      dialogue: `${action === "call" ? "Call us" : "Take the next step"} today.${detail}`.trim(),
      presenterAction: "Hold a still, welcoming look to camera.",
      camera: "Steady medium shot.",
      audio: "Voice stays clear to the last word.",
    };
  }
  return {
    visual: `Show the presenter and the work of ${name} in a natural, professional setting.`,
    dialogue:
      input.valueProposition ||
      `${name} keeps the process straightforward and treats people with respect.`,
    presenterAction: "Gesture naturally toward the work, then return to camera.",
    camera: "Gentle tracking shot, then settle.",
    audio: "Natural ambience, never overpowering the voice.",
  };
}

export function buildMockConcept(input: CreativeBrief): CreativeConcept {
  const windows = sceneWindows(input.durationSeconds);
  const scenes: ConceptScene[] = windows.map(([startSecond, endSecond], index) => {
    const copy = sceneCopy(input, index, windows.length);
    return {
      startSecond,
      endSecond,
      visual: copy.visual,
      presenterAction: copy.presenterAction,
      camera: copy.camera,
      dialogue: copy.dialogue,
      audio: copy.audio,
    };
  });
  const spokenScript = scenes
    .map((scene) => scene.dialogue)
    .filter((line): line is string => Boolean(line))
    .join(" ");
  const avoidNote = input.avoid.trim()
    ? ` We will not say: ${input.avoid.trim()}.`
    : "";
  return {
    title: input.campaignTitle,
    hook: scenes[0]?.dialogue || `A clear introduction from ${input.businessName}.`,
    strategy: `${input.strategy.focus} ${input.strategy.avoid}${avoidNote}`.trim(),
    spokenScript,
    scenes,
    callToAction: input.ctaValue
      ? `${input.ctaType}: ${input.ctaValue}`
      : input.ctaType,
    generationPrompt: `Internal filming brief for ${input.campaignTitle}. Duration ${input.durationSeconds}s. Aspect ${input.aspectRatio}.`,
  };
}

export function createMockCreativeDirector(): CreativeDirectorProvider {
  return {
    async generateConcept(input) {
      return buildMockConcept(input);
    },
  };
}
