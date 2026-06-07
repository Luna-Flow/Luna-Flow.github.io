# Luna-Flow/QED

本文档跟踪当前分支状态。

## 仓库定位

采用 kernel-first 架构、带形式规范和受控前端的定理证明器项目。

## 文档布局

- `README.md` 记录仓库叙事与版本基线。
- `doc_standard.md` 记录文档契约。
- 模块或子系统目录下放 `api.md`、`tutorial.md`、`design.md`。

## 模块概览

- **`kernel`**: 主要实现位于 `src/kernel`。
- **`parser`**: 主要实现位于 `src/parser`。
- **`tactics`**: 主要实现位于 `src/tactics`。
- **`prover`**: 主要实现位于 `src/prover`。
- **`spec`**: 主要实现位于 `doc/qed_formal_spec.typ`。

## 文档入口

- API 参考: [kernel](./kernel/api.md)
- API 参考: [parser](./parser/api.md)
- API 参考: [tactics](./tactics/api.md)
- API 参考: [prover](./prover/api.md)
- API 参考: [spec](./spec/api.md)
\n