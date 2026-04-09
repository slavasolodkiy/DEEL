import type { FlowConfig } from "./types.js";
import { OnboardingEngine } from "./engine.js";
import individualV1 from "./flows/individual-v1.json" with { type: "json" };
import businessV1 from "./flows/business-v1.json" with { type: "json" };

const FLOW_MAP: Record<string, FlowConfig> = {
  "individual-v1": individualV1 as FlowConfig,
  "business-v1": businessV1 as FlowConfig,
};

export function getEngine(flowId: string, version = "v1"): OnboardingEngine {
  const key = `${flowId}-${version}`;
  const flow = FLOW_MAP[key];
  if (!flow) {
    throw new Error(`Flow '${flowId}' version '${version}' not found`);
  }
  return new OnboardingEngine(flow);
}

export function listFlows(): Array<{ id: string; version: string; titleKey: string }> {
  return Object.entries(FLOW_MAP).map(([key, flow]) => {
    const [id, version] = key.split("-") as [string, string];
    return { id, version, titleKey: flow.titleKey };
  });
}
