# facade チュートリアル

Begin with `luna_thread/luna_thread.mbt` and the package tests to understand the exposed MoonBit facade.

## 推奨フロー

1. まずリポジトリ README と facade の API 文書を読む。
2. `luna_thread` にあるコンストラクタまたは入口から始める。
3. 境界挙動へ依存する前に、既存のテストや例で意味論を確認する。

## 実践ガイド

- 内部ヘルパーではなく、文書化された入口を優先する。
- ランタイム・数値・証明状態の前提を下流コードに明示する。
