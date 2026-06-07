# Luna-Flow/QED

このドキュメントは現在のブランチ状態を追跡します。

## リポジトリの位置付け

kernel-first アーキテクチャと形式仕様、制御されたフロントエンドを持つ定理証明器プロジェクトです。

## ドキュメント構成

- `README.md` にリポジトリ叙述とリリース基線を書く。
- `doc_standard.md` に文書契約を書く。
- モジュールまたはサブシステム配下に `api.md`、`tutorial.md`、`design.md` を置く。

## モジュール概要

- **`kernel`**: 主な実装は `src/kernel` にあります。
- **`parser`**: 主な実装は `src/parser` にあります。
- **`tactics`**: 主な実装は `src/tactics` にあります。
- **`prover`**: 主な実装は `src/prover` にあります。
- **`spec`**: 主な実装は `doc/qed_formal_spec.typ` にあります。

## ドキュメント入口

- API リファレンス: [kernel](./kernel/api.md)
- API リファレンス: [parser](./parser/api.md)
- API リファレンス: [tactics](./tactics/api.md)
- API リファレンス: [prover](./prover/api.md)
- API リファレンス: [spec](./spec/api.md)
\n