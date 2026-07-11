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

- API リファレンス: [kernel](/ja_JP/QED/kernel/api)
- API リファレンス: [parser](/ja_JP/QED/parser/api)
- API リファレンス: [tactics](/ja_JP/QED/tactics/api)
- API リファレンス: [prover](/ja_JP/QED/prover/api)
- API リファレンス: [spec](/ja_JP/QED/spec/api)
