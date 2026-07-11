# core API

ルートパッケージ `Luna-Flow/luna-complex` は、汎用複素数コアを公開します。

## 範囲

- ソース境界: `src`
- 想定読者: 公開契約に依存する利用者、統合担当者、保守者
- 状態: active

## 公開契約

- `Complex[T]` は可変構造体で、`re` と `im` フィールドを公開します。
- 構築と更新の入口は `Complex::new`、`set`、`set_re`、`set_im` です。
- スカラー型が対応する能力を持つ場合、ルートパッケージは `Add`、`Sub`、`Neg`、`Mul`、`Div`、`Zero`、`One`、`Conjugate`、`Inverse`、`AddMonoid`、`AddGroup`、`MulMonoid`、`MulGroup`、`Semiring`、`Ring`、`Field` を実装します。
- ルートパッケージは `sin`、`log`、`sqrt` などの解析関数を公開しません。浮動小数点の解析レイヤーには `Luna-Flow/luna-complex/float_backend` を使います。
