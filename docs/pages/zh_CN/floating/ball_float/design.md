# `ball_float` 设计说明

`BallFloat` 是当前仓库里的包络表示。

## 表示

- 非空区间保存外向舍入后的 `lo_ : BinFloat` 与 `hi_ : BinFloat`
- 空区间保存独立的 Empty 状态
- `precision_ : Int`

有界非空值仍可通过以下形式观察：

`[center - radius, center + radius]`

## 半径不变量

构造阶段会保证半径：

- 有限
- 非 NaN
- 非负

当中心值被量化到更低精度时，构造与精度重调路径会把中心位移对应的误差并入半径，避免表示区间缩小。

## `sign` 的含义

如果半径为零，`sign` 就等于中心值的符号。  
如果包络跨过零点，当前实现返回 `Sign::Zero`。

这意味着 `Sign::Zero` 在这里部分承担了“区间跨零”的语义。

## 算术模型

这里的算术遵循包络语义：

- 加法和减法通过相加半径来扩张结果
- 乘法使用端点组合并向外舍入
- 除数仅包含零时返回 Empty；跨零除法返回安全集合包络
- 结果中心在回落到目标精度时，如果发生量化位移，该位移也会并入半径

## 为什么没有总序

`BallFloat` 提供的是：

- 重叠
- 分离
- 可证明的小于/大于

而不是普通实数意义下的总序比较。

## IEEE 1788

`BallFloat` 作为 bare interval 支持 Empty、Entire、交集、凸包、集合关系和 overlap classification。`decorated_ball_float` 提供 decorations 与 NaI。

ITF1788 测试按阶段启用；当前严格门槛覆盖 sets 与 relations，numeric、elementary 和 reverse 阶段尚未声明完整支持。
