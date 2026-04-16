// Placeholder for procedural NPC generation (Phase 2)
// Seed-based random for stable NPC appearance

export function seededRandom(seed: number) {
  let s = seed;
  return {
    next(): number {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      return s / 0x7fffffff;
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
  };
}
