export interface IdleAction {
  readonly id: string;
  readonly duration: number;
  readonly weight: number;
}

export const VITALIY_IDLE_ACTIONS: readonly IdleAction[] = [
  { id: "wipe_counter", duration: 3000, weight: 20 },
  { id: "check_machine", duration: 2500, weight: 15 },
  { id: "adjust_apron", duration: 1500, weight: 10 },
  { id: "stretch_back", duration: 2000, weight: 8 },
  { id: "polish_cup", duration: 3000, weight: 12 },
  { id: "check_phone", duration: 2500, weight: 10 },
  { id: "organize_cups", duration: 2500, weight: 12 },
  { id: "look_at_clock", duration: 1500, weight: 8 },
  { id: "tap_rhythm", duration: 2000, weight: 5 },
] as const;

export const ASLAN_IDLE_ACTIONS: readonly IdleAction[] = [
  { id: "juggle_cup", duration: 3000, weight: 18 },
  { id: "dance_move", duration: 2000, weight: 12 },
  { id: "check_phone", duration: 2500, weight: 15 },
  { id: "laugh", duration: 1500, weight: 10 },
  { id: "stretch_arms", duration: 1500, weight: 8 },
  { id: "wipe_cup", duration: 2500, weight: 12 },
  { id: "pose", duration: 1500, weight: 7 },
  { id: "air_drums", duration: 2000, weight: 10 },
  { id: "write_on_cup", duration: 2500, weight: 8 },
] as const;

export function pickWeightedRandom<T extends { weight: number }>(items: readonly T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[0];
}
