# RFC 0001：Luna-Flow 数值微积分基础架构

状态：实验验证  
目标版本：下一主版本  
范围：架构、算法选型与 API 可行性，不替换当前生产实现

## 1. 决策摘要

下一代 `calculus-numerical` 不再以 GSL 的 `Double` API 和实现结构为蓝本，而是建立在 Luna-Flow 的代数 trait、checked arithmetic 与显式数值上下文之上。

- 当前 `basic`、`deriv`、`diff`、`integration` API 在正式迁移时进入 `legacy/*`，保留一个主版本兼容期。
- 新 API 第一阶段只支持同类型标量函数 `(T) -> T`。坐标类型、返回值类型和误差标量暂不分离。
- `Double`、`Float` 使用无上下文快速实现；`Decimal`、`BinFloat` 使用显式 context adapter。
- 完整入口必须接收 context、容差和资源限制；便捷入口可以使用有文档的默认 context。Decimal 的默认值为 Decimal128。
- 数值算法返回命名结果和诊断信息，不再返回含义不透明的多元组。
- `estimated_error` 表示经验误差估计。只有基于区间数或 BallFloat 的实现才能返回 `certified_bound`。

## 2. 标准与独立实现原则

### 2.1 数值语义

- 二进制与十进制浮点分类、舍入和特殊值以 IEEE 754-2019 为准。
- Decimal 的 context、flags、cohort 和异常语义以 General Decimal Arithmetic 与 decNumber 测试规范为准。
- 任意精度参考值由 MPFR 或 Arb 生成；不以某个机器 `Double` 实现作为正确性标准。

### 2.2 算法资料

实现以论文和公开算法描述为依据，参考成熟库仅用于交叉验证接口与行为：

| 领域 | 第一阶段候选 | 主要依据 | 选择原因 |
| --- | --- | --- | --- |
| 数值导数 | Fornberg 权重 | Fornberg, 1988/1998 | 任意节点、任意导数阶，避免手写 stencil 魔数 |
| 自适应导数 | Richardson/Ridders | Richardson 外推与 Ridders 方法 | 可解释的步长序列与误差估计 |
| 固定求积 | Gauss–Kronrod 15/21 | Gauss–Kronrod 规则与 QUADPACK 文献 | 单次采样同时给出嵌套误差估计 |
| 自适应积分 | 最大误差区间优先细分 | QUADPACK 算法说明 | 成熟的工作区与停止策略 |
| 高精度积分 | Tanh–Sinh | Takahasi–Mori 双指数公式 | 适合端点奇异和高精度 Decimal |
| 光滑函数积分 | Clenshaw–Curtis | Chebyshev 展开文献 | 可复用采样并自然扩展高精度 |
| 有限求和 | pairwise、Kahan、Neumaier | 浮点误差分析文献 | 提供性能与稳定性分层 |
| 无限级数 | Wynn epsilon、Euler 变换 | 收敛加速文献 | 覆盖交错与慢收敛常见场景 |
| 幂级数 | 截断系数代数 | 形式幂级数标准算法 | 支持求值、导数、积分和组合基础 |

GSL 是 GPL 软件。本项目可以比较其公开行为和论文出处，但不得复制、翻译或结构性改写其源代码。

## 3. 依赖边界

依赖必须保持单向：

```text
luna-generic -> arithmetic -> floating
                         \-> calculus-numerical
floating ----------------> calculus-numerical
luna-poly ---------------> calculus-numerical/power_series adapters
autodiff ----------------> optional calculus bridge
```

本阶段不修改 `arithmetic` 与 `floating`。普通代数运算直接组合现有 trait；calculus 内部只为缺失且依赖 context 的能力使用极小 provider。验证稳定后，再提交独立 RFC 将通用的 `next_up`、数值格式和 context 能力上移到 `arithmetic`，并由 `floating` 实现 Decimal/BinFloat 实例。

不得让 `floating` 依赖 calculus。现有 Decimal 类型的 context 能力由 calculus 拥有的 provider 值完成；加减乘除、比较、零、一等非 context 能力继续使用 trait composition。

## 4. 类型系统决策

### 4.1 第一阶段统一标量和值域

稳定入口采用 `(T) -> T`。当前 MoonBit/Luna-Flow 生态没有成熟表达以下关系的公共能力：

```text
V + V -> V
S * V -> V
norm(V) -> E
```

`linear-algebra` 当前的向量缩放也使用相同元素类型。公开 `S/V/E` 三类型 API 会迫使调用者传递大块函数表，并可能在积分热点中引入间接调用。因此向量、矩阵和异构值域积分推迟到独立 RFC。

### 4.2 Trait composition 加最小 provider

不新增包含全部初等函数的 `RealNumber` trait，也不把已有 trait 运算重新包装进函数表。算法通过 trait composition 接收自己需要的最小能力：

- 核心标量：直接组合 `Zero`、`One`、`IntegralHomomorphism`、`Add`、`Sub`、`Mul`、`Div`、`Compare` 等已有 trait。
- 数值格式：epsilon、相邻值、最小 normal、最大 finite、值分类。
- 可选能力：context-aware `sqrt`、整数幂和解析。

只有无法由现有 trait 正确表达的 context-dependent 操作使用极小 provider，例如 `(Context) -> T` 的 context one 和 `(T, Context) -> T` 的 next-up。稳定后这些能力再上移到 `arithmetic`。

### 4.3 Context 与 epsilon

`Float` 和 `Double` 的格式常量由类型决定。Decimal 的 epsilon 和范围由 precision、指数范围及舍入上下文共同决定，因此不得提供无参数的 Decimal `epsilon()`。

Decimal 的工作 epsilon 定义为：

```text
next_plus(1, context) - 1
```

算法入口构造一次派生环境，缓存 epsilon、sqrt(epsilon) 与常用系数。热点循环不得反复构造 context、转换规则表或计算格式常量。

## 5. 包与公开 API 草案

```text
core             context、tolerance、status、diagnostics、experimental adapter
differentiation  Fornberg、Richardson/Ridders
integration      quadrature rule、adaptive controller、workspace
series           compensated sum、convergence acceleration
power_series     truncated series and calculus operations
legacy           current public API compatibility layer
```

建议结果形状：

```moonbit
pub struct IntegrationResult[T] {
  value : T
  estimated_error : T
  evaluations : Int
  intervals : Int
  status : NumericalStatus
}

pub struct IntegrationOptions[T] {
  absolute_tolerance : T
  relative_tolerance : T
  max_evaluations : Int
  max_intervals : Int
}
```

`NumericalStatus` 至少区分完成、资源耗尽、无效容差、舍入停滞、疑似奇点、非有限输入/输出和 context arithmetic failure。底层 Decimal flags 应聚合到 diagnostics，而不是压缩成单个整数错误码。

## 6. 算法边界

### 6.1 导数

- 规则层根据节点和导数阶生成 Fornberg 权重，规则对象可缓存。
- 执行层只负责采样和加权。
- 控制层使用 Richardson/Ridders 调整步长并报告截断与舍入误差。
- `autodiff` 保持独立；calculus 只提供可选 bridge 和算法选择说明，不重复实现 dual number。

### 6.2 积分

- `QuadratureRule[T]` 保存有来源的节点、Gauss 权重和扩展权重。
- 固定规则与自适应 controller 分离；controller 不知道规则系数来源。
- 自适应工作区允许局部 mutation，但不暴露可变状态。
- Double/Float 规则使用具体静态表；Decimal/BinFloat 规则在入口按 context 转换一次并缓存于本次调用。
- Tanh–Sinh 不依赖固定精度表，作为高精度和端点奇异场景的首选补充。

### 6.3 级数

- 有限序列提供 naive、pairwise、Kahan/Neumaier，不让一个 `sum` 隐式选择精度成本。
- 无限级数必须显式给出容差与最大项数，并返回使用项数与终止原因。
- 收敛加速作为可组合策略，不混入序列生成器。
- `PowerSeries[T]` 明确保存截断阶；与 `luna-poly` 的转换是显式 adapter，不把截断级数等同于普通多项式。

## 7. Legacy 迁移

正式迁移分两个版本：

1. 新包发布时，旧入口转发到 `legacy/*`，文档标记弃用并提供逐项迁移表。
2. 下一个主版本删除 legacy；严重正确性问题仍修复，但 legacy 不再新增算法或数值类型。

本 RFC 阶段不移动现有文件，避免在新 API 尚未验证前制造兼容性变化。

## 8. 验证门槛

- 每个领域先交付一个 Double/Decimal 纵向切片，再扩展算法数量。
- Double adapter 原型相对直接实现的目标开销不超过 15%，热点循环不得逐项分配。
- Decimal 全程使用同一个显式 context；测试必须覆盖 inexact、rounded、underflow、overflow 和 invalid operation。
- 解析函数、困难函数与高精度 oracle 分层测试；实际误差与报告误差分别记录。
- 性质测试覆盖线性、区间反转、常数函数、缩放关系、容差单调性和级数截断一致性。

## 9. 后续 RFC

- 将稳定的数值格式能力上移到 `arithmetic`。
- 标量和值域分离及向量/矩阵/复数积分。
- BallFloat/区间数的 certified integration。
- Fourier 级数与 FFT 生态边界。
- ODE/PDE 求解器；不属于本基础能力阶段。

## 参考资料

- B. Fornberg, “Generation of Finite Difference Formulas on Arbitrarily Spaced Grids”, 1988.
- B. Fornberg, “Calculation of Weights in Finite Difference Formulas”, 1998.
- R. Piessens et al., *QUADPACK: A Subroutine Package for Automatic Integration*, 1983.
- H. Takahasi and M. Mori, “Double Exponential Formulas for Numerical Integration”, 1974.
- L. N. Trefethen, “Is Gauss Quadrature Better than Clenshaw–Curtis?”, 2008.
- P. Wynn, “On a Device for Computing the e_m(S_n) Transformation”, 1956.
- IEEE 754-2019, *Standard for Floating-Point Arithmetic*.
- General Decimal Arithmetic Specification and decNumber test suite.
