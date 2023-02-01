export const teletime2norm = (t: string) => {
    const [_a, d, m, y, H, M, _S, _o]: string[] = t.match(/([0-9]+)\.([0-9]+)\.([0-9]+) ([0-9]+):([0-9]+):([0-9]+) ([+-][0-9]+)/)
    return `${y}-${m}-${d}T${H}:${M}`
}
