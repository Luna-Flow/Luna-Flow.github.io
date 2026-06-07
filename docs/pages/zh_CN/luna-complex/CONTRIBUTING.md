# 贡献规范

查看其他语言版本：[English](https://github.com/Luna-Flow/luna-complex/tree/main/doc/en_US/CONTRIBUTING.md) | [ja_JP](https://github.com/Luna-Flow/luna-complex/tree/main/doc/ja_JP/CONTRIBUTING.md)

## 代码风格

- 所有代码统一使用 `moon fmt` 格式化。
- 优先复用 `src/alias.mbt` 中集中定义的别名和导入风格，不要在实现文件里重复堆叠完全限定名调用。
- 注释保持简洁、技术化，重点说明数值稳定性、分支选择和不明显的契约，不要简单复述代码。

## 命名约定

- 绑定和函数名使用小写加下划线，例如 `scaled_re`、`pow_real`。
- 类型和 Trait 使用 PascalCase，例如 `Complex`。
- 文件名使用小写加下划线，并直接反映所负责的能力。
- 如果后续引入错误码，使用全大写加下划线，并以 `E_` 为前缀。

## 文件组织

- 先按包边界组织，再按行为拆分文件。
  当前仓库中，根包负责泛型 `Complex[T]` 核心，`src/double_ext` 负责 `Complex[Double]` 的解析与超越函数层。
- 在每个包内部，再把核心数据结构、初等函数、三角函数、双曲函数和测试分别放在独立文件中。
- 避免 `utils.mbt` 这类兜底文件。新增文件名必须能明确说明职责。
- 公共 API 变更要有意识地控制；内部辅助函数除非确有必要，不应暴露到包接口中。
- 不要假设 `double_ext` 可以给 `Complex[T]` 追加方法。
  以当前 MoonBit 规则，子包不能给别的包定义的类型补方法或 trait impl，所以 `double_ext` 采用自由函数形式。

## 测试要求

- 任何数值行为调整都必须同步补测试或改测试。
- 测试应同时包含回归样例和代数恒等式校验。
- 同时覆盖两层能力：
  根包中的泛型代数能力，以及 `double_ext` 中的 `Complex[Double]` 数值能力。
- 提交前运行 `moon test --enable-coverage`。
- 如果公共 API 有变化，使用 `moon info` 重新生成 `pkg.generated.mbti`。

## 提交规范

- 代码或公开接口有改动时，提交前运行 `./ready_to_pr.sh`。
- Commit message 使用简洁英文 Conventional Commits，例如 `fix: stabilize inverse trigonometric branches`。
- 每次提交只聚焦一个逻辑变更。

## 发布检查

- 发布前先更新 `moon.mod` 中的版本号。
- 确保 `README.md` 与当前仓库状态一致。
- 运行 `moon check` 和 `moon test --enable-coverage`。
- 触发 GitHub Actions `publish-package` 时，输入值必须与 `moon.mod` 中版本完全一致。

## 代码审查

- 如果你不是维护者或协作者，在修改 `moon.mod` 中的依赖或版本前，请先联系维护者。
- 审查重点应放在正确性、数值稳定性、API 清晰度、测试充分性和可维护性。
