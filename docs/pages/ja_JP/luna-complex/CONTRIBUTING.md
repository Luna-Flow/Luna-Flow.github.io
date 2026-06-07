# 貢献ガイドライン

他言語版: [English](https://github.com/Luna-Flow/luna-complex/tree/main/doc/en_US/CONTRIBUTING.md) | [zh_CN](https://github.com/Luna-Flow/luna-complex/tree/main/doc/zh_CN/CONTRIBUTING.md)

## コードスタイル

- すべてのコードを `moon fmt` で整形すること。
- 実装ファイルごとに完全修飾名を繰り返すのではなく、`src/alias.mbt` に集約されたエイリアスと import スタイルを優先すること。
- コメントは簡潔に保ち、数値安定性、分岐選択、非自明な契約のみを説明すること。

## 命名規則

- 束縛名と関数名は `scaled_re`、`pow_real` のように小文字とアンダースコアを使う。
- 型名とトレイト名は `Complex` のように PascalCase を使う。
- ファイル名は小文字とアンダースコアを使い、責務が分かる名前にする。
- 将来エラーコードを導入する場合は、大文字とアンダースコアで `E_` 接頭辞を使う。

## ファイル構成

- まず package 境界で整理し、そのうえで機能ごとにファイルを分割すること。
  このリポジトリでは、ルート package が汎用 `Complex[T]` コアを持ち、`src/double_ext` が `Complex[Double]` の解析・超越関数レイヤーを持つ。
- 各 package の内部では、コアデータ操作、初等関数、三角関数、双曲関数、テストを分離して管理する。
- `utils.mbt` のような曖昧な総合ファイルは避けること。
- 公開 API の追加は意図的に行い、内部補助関数は必要になるまで公開しないこと。
- `double_ext` から `Complex[T]` にメソッドを追加できる前提で設計しないこと。
  現在の MoonBit ルールでは、別 package で定義された型に対して子 package からメソッドや trait impl を追加できないため、`double_ext` は自由関数 API を使う。

## テスト

- 数値挙動を変更した場合は、対応するテストを必ず追加または更新すること。
- 回帰ケースと代数的恒等式チェックの両方を含めること。
- ルート package の汎用代数挙動と、`double_ext` の `Complex[Double]` 数値挙動の両方を維持すること。
- 提出前に `moon test --enable-coverage` を実行すること。
- 公開 API が変わった場合は `moon info` で `pkg.generated.mbti` を再生成すること。

## コミット規則

- コードまたは公開 API を変更した場合は、コミット前に `./ready_to_pr.sh` を実行すること。
- コミットメッセージは英語の Conventional Commits を使い、簡潔に書くこと。例: `fix: stabilize inverse trigonometric branches`
- 1 つのコミットは 1 つの論理変更に集中させること。

## リリースチェック

- 公開前に `moon.mod` のバージョンを更新すること。
- `README.md` が現在のリポジトリ状態を反映していることを確認すること。
- `moon check` と `moon test --enable-coverage` を実行すること。
- GitHub Actions の `publish-package` を起動する際は、`moon.mod` と完全一致するバージョンを入力すること。

## コードレビュー

- メンテナーまたはコラボレーターでない場合、`moon.mod` の依存関係やバージョンを変更する前に連絡すること。
- レビューでは、正しさ、数値安定性、API の明確さ、テストの十分性、保守性を重視すること。
