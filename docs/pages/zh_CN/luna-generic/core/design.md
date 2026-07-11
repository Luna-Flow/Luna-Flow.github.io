# core 设计

## 设计目标

`luna-generic` 要给整个 LunaFlow 提供一套共享的代数词汇，让
`arithmetic`、`luna-complex`、`linear-algebra`、`luna-poly` 等包能够
复用同一组能力边界。

## 核心设计决策

- trait 图保持分层且足够小。
- `Ring`、`Field`、`Integral`、`Nat` 这类结构 traits 与 `Zero`、`One`、
  `Inverse`、`Conjugate` 这类操作 traits 分离。
- 嵌入通过 `NatHomomorphism` 和 `IntegralHomomorphism` 明确表达。
- `Integral::normalize` 作为到 `BigInt` 的统一精确桥接。
- 目标侧的默认同态实现统一经由规范化后的 `BigInt`。
- 无符号类型不提供加法逆元，保证抽象在数学上保持诚实。

## 边界

- 本包不定义矩阵、复数、多项式、解析函数或数值算法。
- 它不会刻意抹平精确数值系统与近似数值系统之间的语义差异。
