export class CanonicalAuthorityGeneration {
  private value = 0;

  get current(): number {
    return this.value;
  }

  advance(): number {
    this.value += 1;
    return this.value;
  }

  isCurrent(expected: number): boolean {
    return this.value === expected;
  }
}
