# current_state チュートリアル

There is no runnable user tutorial yet because the repository is still empty. Use this page to track what must exist before public examples are added.

## 推奨フロー

1. まずリポジトリ README と current_state の API 文書を読む。
2. `.` にあるコンストラクタまたは入口から始める。
3. 境界挙動へ依存する前に、既存のテストや例で意味論を確認する。

## 実践ガイド

- 内部ヘルパーではなく、文書化された入口を優先する。
- ランタイム・数値・証明状態の前提を下流コードに明示する。
\n