# core 教程

## 泛型解析辅助函数

```moonbit
fn hypot2[T : Add + Mul + Sqrt](x : T, y : T) -> T {
  (x * x + y * y).sqrt()
}
```

这样写能精确表达算法真正需要的解析能力，而不是绑定死某个具体数值类型。

## Checked 除法

```moonbit
fn safe_ratio[T : DivChecked](x : T, y : T) -> Result[T, ArithmeticError] {
  x.div_checked(y, ArithmeticContext::new(32))
}
```

当 API 边界需要显式暴露除零、定义域或精度相关失败时，应优先使用 checked 层。

## Checked 比较

```moonbit
fn ordering_or_error[T : CompareChecked](lhs : T, rhs : T) -> Result[Int, ArithmeticError] {
  lhs.compare_checked(rhs)
}
```

这适用于 NaN 等不能安全折叠成总序的语义。

## 实践建议

- 只有接受直接后端语义时才使用 unchecked traits。
- 需要显式失败语义时优先 checked traits。
- 代数结构仍属于 `luna-generic`，`arithmetic` 只负责解析能力。
