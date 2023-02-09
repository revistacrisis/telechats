export const teletime2norm = (t: string) => {
    const match = t.match(/([0-9]+)\.([0-9]+)\.([0-9]+) ([0-9]+):([0-9]+):([0-9]+) ([+-][0-9]+)/);
    if (!match) return "";
    const [_a, d, m, y, H, M, _S, _o]: RegExpMatchArray = match;
    return `${y}-${m}-${d}T${H}:${M}`
}
