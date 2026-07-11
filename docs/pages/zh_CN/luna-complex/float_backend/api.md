# float_backend API

`Luna-Flow/luna-complex/float_backend` 暴露复数的浮点解析后端。

## 范围

- 源码边界：`src/float_backend`
- 读者：需要依赖公开契约的使用者、集成方和维护者
- 状态：active

## 公开契约

- 从根包重新导出 `Complex[T]`。
- 定义后端能力 trait：`FloatingAnalyticScalar`、`FloatingSpecialValues` 和 `FloatingBackendScalar`。
- 为 `Float` 和 `Double` 提供这些后端 trait 的实现。
- 当前完整解析函数面向 `Complex[Double]`：极坐标构造、辐角与模长辅助函数、平方根、指数、对数、幂、三角函数、反三角函数、双曲函数和反双曲函数。
- IEEE 特殊值行为、分支选择和数值稳定 helper 都保留在本包内，不进入泛型根包。
