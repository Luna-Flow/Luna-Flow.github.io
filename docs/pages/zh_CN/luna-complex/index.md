# Luna-Flow/luna-complex

本文档跟踪当前仓库的 **v0.3.0** 基线。

## 仓库定位

泛型复数核心，以及独立的浮点解析后端。

## 文档布局

- `README.md` 记录仓库叙事与版本基线。
- `doc_standard.md` 记录文档契约。
- 模块或子系统目录下放 `api.md`、`tutorial.md`、`design.md`。

## 模块概览

- **`core`**: 泛型 `Complex[T]` 构造、修改和代数 trait 实现。
- **`float_backend`**: 后端本地浮点 trait，以及当前 `Complex[Double]` 解析函数面。

## 文档入口

- API 参考: [core](/zh_CN/luna-complex/core/api)
- API 参考: [float_backend](/zh_CN/luna-complex/float_backend/api)
