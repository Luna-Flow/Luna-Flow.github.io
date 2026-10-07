// Integrals for the landing montage, written in TeX and typeset in Computer
// Modern (the face Typst uses for mathematics by default). Each formula is
// balanced around the sign: `lhs` sits to its left, `lo` and `hi` are its
// limits, `body` follows it. The last one is the vision.

export interface Integral {
  lhs?: string;
  lo?: string;
  hi?: string;
  body: string;
  vision?: boolean;
}

export const integrals: Integral[] = [
  { body: 'y\\,dx' },
  { body: 'x\\,dx = \\tfrac12 x^2' },
  { body: '\\frac{dx}{x} = \\ln x' },
  { body: 'e^x\\,dx = e^x' },
  { lo: 'a', hi: 'b', body: 'f(x)\\,dx' },
  { lhs: 'f(b) - f(a) =', lo: 'a', hi: 'b', body: "f'(x)\\,dx" },
  { body: 'u\\,dv = uv - \\int v\\,du' },
  { lo: '0', hi: '\\pi', body: '\\sin x\\,dx = 2' },
  { lo: '0', hi: '\\infty', body: 'e^{-x}\\,dx = 1' },
  { body: '\\cos x\\,dx = \\sin x' },
  { lhs: '\\frac{1}{n+1} =', lo: '0', hi: '1', body: 'x^n\\,dx' },
  { lhs: 'S =', lo: 't_0', hi: 't_1', body: 'L\\,dt' },
  { lo: 'E', body: 'f\\,d\\mu' },
  { body: 'p\\,dq = nh' },
  { lhs: '\\mathbb{E}[X] =', body: 'x\\,dF(x)' },
  { lhs: '\\frac{\\pi}{2} =', lo: '0', hi: '\\infty', body: '\\frac{\\sin x}{x}\\,dx' },
  { lhs: '\\|f\\|_p^p =', body: '|f|^p\\,d\\mu' },
  { lhs: '\\langle f, g\\rangle =', body: 'f\\,\\bar g\\,dx' },
  { body: '\\delta(x)\\,dx = 1' },
  { lhs: '\\Gamma(s) =', lo: '0', hi: '\\infty', body: 't^{s-1}e^{-t}\\,dt' },
  { lhs: '\\zeta(s)\\,\\Gamma(s) =', lo: '0', hi: '\\infty', body: '\\frac{x^{s-1}}{e^x - 1}\\,dx' },
  { lhs: '\\sqrt{\\pi} =', lo: '-\\infty', hi: '\\infty', body: 'e^{-x^2}\\,dx' },
  { lo: '\\partial\\Omega', body: '\\omega = \\int_{\\Omega} d\\omega' },
  { lhs: '2\\pi i \\sum \\operatorname{Res} =', lo: '\\gamma', body: 'f(z)\\,dz' },
  { lhs: 'F(s) =', lo: '0', hi: '\\infty', body: 'f(t)\\,e^{-st}\\,dt' },
  { lhs: '\\hat f(\\xi) =', body: 'f(x)\\,e^{-2\\pi i \\xi x}\\,dx' },
  { body: '|\\psi(x)|^2\\,dx = 1' },
  { lhs: '0 =', lo: '0', hi: '2\\pi', body: 'e^{in\\theta}\\,d\\theta' },
  { lhs: '-1 =', lo: '0', hi: '1', body: '\\ln x\\,dx' },
  { body: 'p(x)\\,dx = 1' },
  { lhs: '\\mathbb{E}[f] =', body: 'f\\,dP' },
  { lhs: 'H(p) = -', body: 'p \\log p\\,dx' },
  { lhs: 'D(p \\,\\|\\, q) =', body: 'p \\log \\frac{p}{q}\\,dx' },
  { lhs: 'p(x) =', body: 'p(x \\mid \\theta)\\,p(\\theta)\\,d\\theta' },
  { lhs: '(f * g)(t) =', body: 'f(\\tau)\\,g(t - \\tau)\\,d\\tau' },
  { body: 'f\\,dx \\approx \\textstyle\\sum_i w_i f(x_i)' },
  // The vision: abstraction, accumulated along the flow, over the range the
  // ecosystem covers, from algebra to proof.
  {
    vision: true,
    lhs: '\\text{Luna Flow} =',
    lo: '\\text{Algebra}',
    hi: '\\text{Proof}',
    body: '\\textcolor{#e05cc4}{\\text{Abstraction}}\\,\\mathrm{d}(\\text{Flow})',
  },
];
