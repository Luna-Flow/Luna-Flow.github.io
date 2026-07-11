# Arithmetic 文档

这里是 `arithmetic` `0.2.2` 的简体中文文档入口。

## 概览

- `luna-generic` 继续表达代数结构。
- `arithmetic` 只表达函数能力，不打包定义“实数类型”语义。
- `Float` 与 `Double` 的实例仍在主包里，但会直接调用 `Kaida-Amethyst/math`。
- `BigInt` 与整数族基础类型只提供保持闭合的精确能力实现，例如整数幂 `Power`。
- 浮点默认实例以后端方式直接使用 `Kaida-Amethyst/math`。
- 这个包当前不建模序、拓扑、支路或主值等更高层分析语义。

## 能力分层

- 非 checked 的 elementary traits 继续保留，用于原生标量或其他上下文无关后端。
- checked/contextual traits 统一返回 `Result[Self, ArithmeticError]`，并接收 `ArithmeticContext`。
- enclosure traits 用来表达包含、重叠和确定性比较关系，不伪造总序。

## 语义说明

- 公共 trait 会保持具体的 `Self` 返回类型，不会自动提升到额外的包装结果类型。
- 除非具体实例另行声明更强保证，定义域合法性默认仍属于调用方契约的一部分。
- 非 checked 的 `Float` 与 `Double` 边界值、特殊值和支路语义继承自 `Kaida-Amethyst/math`。
- checked `Float` 与 `Double` 会在文档声明的实值定义域失败上返回结构化错误，例如 checked 平方根遇到负实数输入时返回 `DomainError`。
- 当前内置 `Float` 与 `Double` checked 操作不会根据 `ArithmeticContext` 执行任意精度或舍入控制；该 context 是为上下文化实现共享的边界数据。
- 整数族支持会刻意更窄，只实现那些在该类型上仍能保持闭合的能力。
- `arithmetic` 是能力边界包，不在这一层引入微积分、矩阵、复数、符号代数或特殊函数。

## `Power` 前置条件

- `Power::pow` 在浮点族和整数族之间共享同一个接口，但不同实例接受的参数空间并不完全一致。
- `BigInt`、`Int`、`Int16`、`Int64` 要求指数必须是非负数。
- 对这些有符号整数实例传入负指数会在运行时 `abort`。
- `UInt`、`UInt16`、`UInt64` 的指数类型天然非负，因此不存在这一额外检查。
- 这个包会把前置条件写清楚，但选择满足数学定义域的参数，仍然部分属于调用方责任。
- `PowNatChecked` 与 `PowIntChecked` 会把整数指数能力拆成 checked 边界。
- 在这层 checked 语义里，`x^0` 一律返回一，包括 `0^0`。
