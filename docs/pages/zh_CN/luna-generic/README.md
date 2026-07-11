# Luna-Generic

这是 `Luna-Flow/luna-generic` 预期 `v0.3.3` 发布版本的简体中文文档。

## 概览

`luna-generic` 为 Luna 项目提供通用代数 trait 与默认数值类型实例。

当前版本的重点有三项：

- `BigInt` 已纳入默认导出的数值类型集合。
- 整数到目标类型的嵌入被重构为显式的同态 trait。
- `Integral::normalize` 为所有整数源类型提供统一的 `BigInt` 规范化入口。

## 导出 Trait

- `AddMonoid`, `MulMonoid`
- `AddGroup`, `MulGroup`
- `Semiring`, `Ring`, `Field`
- `Integral`, `Nat`
- `NatHomomorphism`, `IntegralHomomorphism`
- `Num`

## 导出操作与默认类型

- 操作 trait: `One`, `Zero`, `Inverse`, `Conjugate`
- 默认数值类型: `Int`, `Int16`, `Int64`, `UInt`, `UInt16`, `UInt64`, `BigInt`, `Float`, `Double`

## 整数模型

- `Nat` 覆盖 `UInt`、`UInt16`、`UInt64`
- `Integral` 覆盖有符号整数、无符号整数以及 `BigInt`
- 无符号整数实例只到 `Semiring`
- `Integral::normalize` 会把任意整数值规范化为 `BigInt`
- `Nat` 通过继承复用 `Integral::normalize`，以精确嵌入到 `BigInt`

## 嵌入接口

- `NatHomomorphism::from_nat` 提供从任意 `Nat` 源类型到目标类型的多态嵌入
- `IntegralHomomorphism::from_integral` 提供从任意 `Integral` 源类型到目标类型的多态嵌入
- 默认实现路径是先走 `Integral::normalize`，再做目标类型自己的 `BigInt` 转换
- 到 `BigInt` 的嵌入是精确的
- 到 `Float` 和 `Double` 的嵌入是近似的，大数值可能发生舍入

## 校验

建议的发布前检查：

```bash
moon check
moon test
```
