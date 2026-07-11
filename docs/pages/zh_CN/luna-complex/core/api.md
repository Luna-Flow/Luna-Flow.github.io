# core API

根包 `Luna-Flow/luna-complex` 暴露泛型复数核心。

## 范围

- 源码边界：`src`
- 读者：需要依赖公开契约的使用者、集成方和维护者
- 状态：active

## 公开契约

- `Complex[T]` 是可变结构体，公开 `re` 和 `im` 字段。
- 构造与修改入口包括 `Complex::new`、`set`、`set_re` 和 `set_im`。
- 当标量类型提供相应能力时，根包实现泛型代数运算和 Luna Flow trait：`Add`、`Sub`、`Neg`、`Mul`、`Div`、`Zero`、`One`、`Conjugate`、`Inverse`、`AddMonoid`、`AddGroup`、`MulMonoid`、`MulGroup`、`Semiring`、`Ring` 和 `Field`。
- 根包不暴露 `sin`、`log`、`sqrt` 等解析函数；浮点解析层位于 `Luna-Flow/luna-complex/float_backend`。
