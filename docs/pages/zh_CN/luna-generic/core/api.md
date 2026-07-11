# core API

## 作用

`luna-generic` 是 LunaFlow 的代数 trait 基础层。它本身不提供数值算法
或容器，而是给上层包提供共享的能力边界。

## 结构 traits

- `AddMonoid`、`MulMonoid`
- `AddGroup`、`MulGroup`
- `Semiring`、`Ring`、`Field`
- `Integral`
- `Nat`
- `NatHomomorphism`
- `IntegralHomomorphism`
- `Num`

这些定义在 `src/structure.mbt` 中。

## 操作 traits

- `Zero`
- `One`
- `Inverse`
- `Conjugate`

这些定义在 `src/operation.mbt` 中。

## 内置实例

- 有符号整数：`Int`、`Int16`、`Int64`
- 无符号整数：`UInt`、`UInt16`、`UInt64`
- 精确大整数：`BigInt`
- 浮点实例：`Float`、`Double`

## 语义说明

- `Integral::normalize(Self) -> BigInt` 是把任意整型值规范化到 `BigInt`
  的标准入口。
- `Nat` 也通过 trait 继承复用同一条 `normalize(Self) -> BigInt` 路径。
- `NatHomomorphism::from_nat` 与 `IntegralHomomorphism::from_integral`
  不再按位宽拆方法，而是对源 trait 做多态嵌入。
- 默认嵌入路径是先做 `Integral::normalize`，再做目标类型自己的 `BigInt`
  转换。
- 无符号整数实例止步于 `Semiring`，不会伪装成带加法逆元的结构。
- `Float` 与 `Double` 的同态嵌入是近似的，大整数可能发生舍入。

## 源码入口

- `src/structure.mbt`：trait 定义
- `src/operation.mbt`：基础操作 traits
- `src/impl_signed.mbt`、`src/impl_unsigned.mbt`、`src/impl_bigint.mbt`、
  `src/impl_float.mbt`、`src/impl_dbl.mbt`：默认实例
