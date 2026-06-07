# Luna-Flow/luna-poly

本文档跟踪当前分支状态。

## 仓库定位

包含稠密/稀疏多项式表示与乘法后端的库。

## 文档布局

- `README.md` 记录仓库叙事与版本基线。
- `doc_standard.md` 记录文档契约。
- 模块或子系统目录下放 `api.md`、`tutorial.md`、`design.md`。

## 模块概览

- **`dense_poly`**: 主要实现位于 `src/dense_poly.mbt`。
- **`dense_multi`**: 主要实现位于 `src/dense_multi.mbt`。
- **`sparse_poly`**: 主要实现位于 `src/sparse_poly.mbt`。
- **`exp_vec`**: 主要实现位于 `src/exp_vec.mbt`。
- **`algebra`**: 主要实现位于 `src/algebra.mbt`。

## 文档入口

- API 参考: [dense_poly](./dense_poly/api.md)
- API 参考: [dense_multi](./dense_multi/api.md)
- API 参考: [sparse_poly](./sparse_poly/api.md)
- API 参考: [exp_vec](./exp_vec/api.md)
- API 参考: [algebra](./algebra/api.md)
