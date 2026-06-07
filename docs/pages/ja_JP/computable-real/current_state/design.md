# current_state 設計

The design work for computable-real must start by fixing semantic scope, approximation model, and interoperability with arithmetic and floating.

## 責務

- `.` を軸にコードと文書の整合を保つ。
- 重要な内部差異を隠さず、実際の実行モデルをそのまま説明する。
- 保守者が維持すべき拡張点、不変条件、制約を書く。

## 保守メモ

- モジュール境界、主要アルゴリズム、可観測意味論が変わったら更新する。
- 未完成なモジュールなら、その事実を明記し、未来の API を捏造しない。
\n