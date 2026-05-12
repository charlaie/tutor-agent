function unwrapActivityArgs(args: unknown, keys: string[]) {
  if (!args || typeof args !== "object") {
    return args;
  }

  const record = args as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (value && typeof value === "object") {
      return value;
    }
  }

  return args;
}

export function normalizeQuizArgs(args: unknown) {
  return unwrapActivityArgs(args, ["quiz", "activity", "args", "input"]);
}

export function normalizeEventOrderingArgs(args: unknown) {
  return unwrapActivityArgs(args, [
    "eventOrdering",
    "ordering",
    "activity",
    "args",
    "input",
  ]);
}

export function normalizeMisconceptionDetectiveArgs(args: unknown) {
  return unwrapActivityArgs(args, [
    "misconceptionDetective",
    "detective",
    "activity",
    "args",
    "input",
  ]);
}
