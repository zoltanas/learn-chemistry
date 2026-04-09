export function calculateHaberKc(tempCelsius: number): number {
    // Reference point: 500 C (773.15 K) -> Kc ~ 0.040
    // Enthalpy change: -92.2 kJ/mol
    const T2 = tempCelsius + 273.15;
    const T1 = 773.15;
    const K1 = 0.040;
    const deltaH = -92200; // J/mol
    const R = 8.314;

    // Van 't Hoff: ln(K2) = ln(K1) + (-deltaH / R) * (1/T2 - 1/T1)
    const lnK2 = Math.log(K1) + (-deltaH / R) * (1 / T2 - 1 / T1);
    const K2 = Math.exp(lnK2);

    return K2;
}

export interface IceResult {
    x: number;
    finalA: number; // N2
    finalB: number; // H2
    finalC: number; // NH3
    Q: number;
    shiftContext: "Dešinėn (Į produktus)" | "Kairėn (Į reagentus)" | "Pusiausvyra prisitaikiusi";
}

// Bisection numerical solver for Haber ICE Table: [N2] + 3[H2] <=> 2[NH3]
export function solveHaberICE(initialN2: number, initialH2: number, initialNH3: number, Kc: number): IceResult {
    // A small epsilon to prevent exact division by zero
    const eps = 1e-10;
    const a = Math.max(initialN2, eps);
    const b = Math.max(initialH2, eps);
    const c = Math.max(initialNH3, eps);

    const Q = (c * c) / (a * Math.pow(b, 3));

    if (Math.abs(Q - Kc) / Kc < 1e-3) {
        return {
            x: 0,
            finalA: a,
            finalB: b,
            finalC: c,
            Q,
            shiftContext: "Pusiausvyra prisitaikiusi"
        };
    }

    const isShiftRight = Q < Kc;
    let low = 0;
    let high = 0;

    if (isShiftRight) {
        // Shift right, x > 0
        low = 0;
        // Max x is bounded by reactants: N2 -> a, H2 -> b/3
        high = Math.min(a, b / 3) - eps;

        for (let i = 0; i < 60; i++) {
            const mid = (low + high) / 2;
            const eqA = a - mid;
            const eqB = b - 3 * mid;
            const eqC = c + 2 * mid;
            const currentK = (eqC * eqC) / (eqA * Math.pow(eqB, 3));

            if (currentK < Kc) {
                low = mid; // Need more products, increase x
            } else {
                high = mid; // Need fewer products, decrease x
            }
        }
    } else {
        // Shift left, x < 0
        // Max magnitude of x bounded by products: NH3 -> -c/2
        low = -c / 2 + eps;
        high = 0;

        for (let i = 0; i < 60; i++) {
            const mid = (low + high) / 2;
            const eqA = a - mid;
            const eqB = b - 3 * mid;
            const eqC = c + 2 * mid;
            const currentK = (eqC * eqC) / (eqA * Math.pow(eqB, 3));

            if (currentK > Kc) {
                // K is too large, need more reactants, so x must be more negative (smaller)
                high = mid;
            } else {
                low = mid;
            }
        }
    }

    const finalX = (low + high) / 2;

    return {
        x: finalX,
        finalA: Math.max(0, a - finalX),
        finalB: Math.max(0, b - 3 * finalX),
        finalC: Math.max(0, c + 2 * finalX),
        Q,
        shiftContext: isShiftRight ? "Dešinėn (Į produktus)" : "Kairėn (Į reagentus)"
    };
}
