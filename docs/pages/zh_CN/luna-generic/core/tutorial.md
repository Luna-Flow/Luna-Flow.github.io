# core 教程

## 面向结构写算法，而不是面向具体数字类型

```moonbit
fn double_and_add_one[T : Ring + One](x : T) -> T {
  x + x + T::one()
}
```

这个函数可以复用于有符号整数、`BigInt`、`Float`、`Double`，以及未来
实现了同样 traits 的外部类型。

## 用 `BigInt` 统一整型表示

```moonbit
fn canonical_text[T : Integral + Show](x : T) -> String {
  x.normalize().to_string()
}
```

当你需要跨多种整型源类型共享一个精确表示时，应优先使用
`Integral::normalize`。

## 显式做目标侧嵌入

```moonbit
fn embed_nat[F : NatHomomorphism](x : UInt) -> F {
  NatHomomorphism::from_nat(x)
}
```

这样可以避免上层包偷偷依赖隐式转换规则。

`NatHomomorphism` 和 `IntegralHomomorphism` 的实现方式应当统一为：
先用 `Integral::normalize` 把源值规约到 `BigInt`，再做目标类型自己的转换。

## 实践建议

- 只要求算法真正需要的最小 trait 集合。
- 只有确实需要倒数或除法时再要求 `Field`。
- 即使共享同一抽象表面，也要把 `Float` 和 `Double` 当作近似后端来看。
