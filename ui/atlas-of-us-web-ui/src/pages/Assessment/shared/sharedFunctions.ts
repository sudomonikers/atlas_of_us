export const interpolateColor = (startColor: string, endColor: string, progress: number): string => {
    const start = parseInt(startColor.slice(1), 16);
    const end = parseInt(endColor.slice(1), 16);
    
    const r1 = (start >> 16) & 255;
    const g1 = (start >> 8) & 255;
    const b1 = start & 255;
    
    const r2 = (end >> 16) & 255;
    const g2 = (end >> 8) & 255;
    const b2 = end & 255;
    
    const r = Math.round(r1 + (r2 - r1) * progress);
    const g = Math.round(g1 + (g2 - g1) * progress);
    const b = Math.round(b1 + (b2 - b1) * progress);
    
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};