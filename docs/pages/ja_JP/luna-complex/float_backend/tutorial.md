# float_backend チュートリアル

`Complex[Double]` に解析関数や超越関数が必要なときは `float_backend` を使います。

## 推奨フロー

1. ルートパッケージまたは `float_backend` から `Complex` を import する。
2. `Complex[Double]` の値を作る。
3. `@float_backend.log(z)`、`@float_backend.sin(z)`、`@float_backend.sqrt(z)` などの自由関数を呼ぶ。

## 実用上の注意

- 下流で公式を再実装せず、このパッケージの自由関数を優先して使う。
- `arg`、`log`、`sqrt`、逆三角関数などの分岐に敏感な関数は、このパッケージの可観測契約として扱う。
- バックエンド trait は、新しい浮動小数点バックエンドコードを書く場合だけ直接使う。
