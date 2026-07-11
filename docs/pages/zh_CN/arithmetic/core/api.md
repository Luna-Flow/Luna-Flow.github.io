# core API

## 作用

`arithmetic` 在 `luna-generic` 的基础上补充了解析能力。它负责描述
平方根、对数、三角函数等能力 traits，以及 checked/contextual 的算术边界。

## Unchecked 能力 traits

- `Sqrt`、`Cbrt`、`Radical`
- `Exponential`
- `Logarithmic`
- `Power`
- `Trigonometric`、`InverseTrigonometric`
- `Hyperbolic`、`InverseHyperbolic`
- `Constants`

这些定义在 `src/elementary.mbt` 中。

## Checked / contextual 表面

### 共享类型

- `FpClass`
- `RoundingMode`
- `ArithmeticContext`
- `ArithmeticErrorKind`
- `ArithmeticError`

### Checked traits

- `SqrtChecked`
- `DivChecked`
- `CompareChecked`
- `PowNatChecked`
- `PowIntChecked`
- `ParseChecked`

### Enclosure 关系

- `Contains`
- `Overlaps`
- `DefinitelyLt`
- `DefinitelyLe`
- `MaybeEq`

这些定义在 `src/checked.mbt` 中。

## 内置实例

- `Float` 与 `Double` 通过 `Kaida-Amethyst/math` 实现完整的 elementary 表面。
- `Float` 与 `Double` 也实现 `sqrt_checked`、`div_checked`、
  `compare_checked`、`pow_nat_checked`、`pow_int_checked` 等 checked traits。
- `BigInt` 与整数族只实现保持闭合的精确子集，最典型的是整数 `Power`。

## 语义说明

- unchecked traits 把定义域和 branch 语义交给具体实例决定。
- checked traits 也使用实例定义的数学域；`SqrtChecked` 不要求所有实现都支持
  实数序或与零比较。
- `DivChecked` 同样不要求 NaN 或 infinity 等浮点概念；非法除法由具体实例的数学域定义。
- 内置的 `Float` 与 `Double` checked 平方根是默认实值实例，因此负实数输入会返回
  `DomainError`。
- 内置的 `Float` 与 `Double` checked 除法会把 `0 / 0` 与
  `infinity / infinity` 归为 `DomainError`，非零数除以零仍归为
  `DivisionByZero`。
- 在有符号整数和 `BigInt` 上，`Power` 要求指数非负；负指数会在运行时 abort。
- `ArithmeticContext::new` 会把 precision 下限钳到 `1`。
- `PowNatChecked` 把 `x^0` 视为乘法单位元，包括 `0^0`。
- enclosure traits 只是关系，不伪装成标量总序。
