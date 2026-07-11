# FLOATING ドキュメント

このディレクトリは現在の **`0.4.1`** 実装を説明します。過去のリリース
情報は [CHANGELOG.md](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md) に集約し、README は現在の基準だけを扱います。

## 読み進め方

- 具体的な数値型には `bin_float`、`decimal`、`ball_float` を使います。
- checked 演算を閉じたパイプラインとして組み立てる場合は、対応する
  `*_result` パッケージを使います。
- 複数の表現に共通する厳密な境界が必要な場合は `semantic` を参照します。
- 数値式フロントエンドには `numeric_expr`、GDA `.decTest` と Decimal
  適合性処理には `gda_expr` を参照します。
- `internal` と `consistency` は実装・検証層であり、安定したアプリ API ではありません。

## 基本文書

- [ドキュメント標準](/ja_JP/floating/doc-standard)
- [正しさ監査](/ja_JP/floating/correctness_audit)
- [リリース履歴](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md)
- [適合性テスト手順](https://github.com/Luna-Flow/floating/blob/main/testdata/decimal/README.md)

## パッケージ文書

- [`def`](/ja_JP/floating/def/api): [API](/ja_JP/floating/def/api)、[チュートリアル](/ja_JP/floating/def/tutorial)、[設計](/ja_JP/floating/def/design)
- [`bin_float`](/ja_JP/floating/bin_float/api): [API](/ja_JP/floating/bin_float/api)、[チュートリアル](/ja_JP/floating/bin_float/tutorial)、[設計](/ja_JP/floating/bin_float/design)
- [`decimal`](/ja_JP/floating/decimal/api): [API](/ja_JP/floating/decimal/api)、[チュートリアル](/ja_JP/floating/decimal/tutorial)、[設計](/ja_JP/floating/decimal/design)、[アーキテクチャ調査](/floating/decimal/architecture_research)
- [`ball_float`](/ja_JP/floating/ball_float/api): [API](/ja_JP/floating/ball_float/api)、[チュートリアル](/ja_JP/floating/ball_float/tutorial)、[設計](/ja_JP/floating/ball_float/design)
- [`bin_float_result`](/ja_JP/floating/bin_float_result/api): [API](/ja_JP/floating/bin_float_result/api)、[チュートリアル](/ja_JP/floating/bin_float_result/tutorial)、[設計](/ja_JP/floating/bin_float_result/design)
- [`decimal_result`](/ja_JP/floating/decimal_result/api): [API](/ja_JP/floating/decimal_result/api)、[チュートリアル](/ja_JP/floating/decimal_result/tutorial)、[設計](/ja_JP/floating/decimal_result/design)
- [`ball_float_result`](/ja_JP/floating/ball_float_result/api): [API](/ja_JP/floating/ball_float_result/api)、[チュートリアル](/ja_JP/floating/ball_float_result/tutorial)、[設計](/ja_JP/floating/ball_float_result/design)
- [`semantic`](/ja_JP/floating/semantic/api): [API](/ja_JP/floating/semantic/api)、[チュートリアル](/ja_JP/floating/semantic/tutorial)、[設計](/ja_JP/floating/semantic/design)
- [`numeric_expr`](/ja_JP/floating/numeric_expr/api): [API](/ja_JP/floating/numeric_expr/api)、[チュートリアル](/ja_JP/floating/numeric_expr/tutorial)、[設計](/ja_JP/floating/numeric_expr/design)
- [`gda_expr`](/ja_JP/floating/gda_expr/api): [API](/ja_JP/floating/gda_expr/api)、[チュートリアル](/ja_JP/floating/gda_expr/tutorial)、[設計](/ja_JP/floating/gda_expr/design)
- [`internal`](/ja_JP/floating/internal/api): [API](/ja_JP/floating/internal/api)、[チュートリアル](/ja_JP/floating/internal/tutorial)、[設計](/ja_JP/floating/internal/design)

英語ツリーを構造上の基準とし、中国語・日本語でも同じ Markdown ファイル集合と文書責務を保ちます。
