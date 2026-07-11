# core 設計

## 設計目標

`arithmetic` は LunaFlow を「代数構造」から「解析 capability」へ広げつつ、
後端差異と意味論境界を明示したまま扱うことを目指します。

## 主な設計判断

- 解析 capability を小さな traits 群へ分割する。
- unchecked と checked を共存させ、直接後端意味論と明示的検証を選べるようにする。
- checked 層は `ArithmeticContext` と `ArithmeticError` を共有する。
- enclosure 関係を scalar 比較から分離し、意味論上の嘘を避ける。
- 整数族は閉じた操作だけを公開し、surface を意図的に狭く保つ。

## 境界

- このパッケージはベクトル、行列、複素数、記号オブジェクトを定義しない。
- branch cut や特殊値意味論を 1 つの曖昧な抽象へ押し込まない。
