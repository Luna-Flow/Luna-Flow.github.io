import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const workspaceRoot = process.env.LUNAFLOW_REPO_ROOT
  ? path.resolve(process.env.LUNAFLOW_REPO_ROOT)
  : path.resolve(repoRoot, '..');
const configPath = path.join(repoRoot, 'docs', 'repo-docs.config.json');
const generatedRoot = path.join(repoRoot, 'docs', 'pages');
const generatedDataDir = path.join(repoRoot, 'docs', '.vitepress', 'generated');
const manifestPath = process.env.LUNAFLOW_REPO_MANIFEST
  ? path.resolve(process.env.LUNAFLOW_REPO_MANIFEST)
  : null;

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const locales = [
  {
    id: 'root',
    source: 'en_US',
    outDir: '',
    label: 'English',
    title: 'Luna Flow Documentation',
    description: 'This site aggregates standardized documentation from Luna-Flow repositories.',
    heroName: 'Luna Flow',
    heroText: 'Composable Mathematical Ecosystem for MoonBit',
    heroTagline: 'A modern scientific computing foundation centered around algebraic abstraction, numerical reliability, and ecosystem interoperability.',
    heroPrimary: 'Browse Documentation',
    heroSecondary: 'GitHub',
    heroSecondaryLink: 'https://github.com/Luna-Flow',
    navText: 'Home',
    overviewText: 'Overview',
    standardText: 'Doc Standard',
    docsText: 'Docs',
    docsIndexTitle: 'Documentation Directory',
    docsIndexDescription: 'Browse standardized documentation for every Luna-Flow repository from a single entrypoint.',
    lang: 'en-US',
  },
  {
    id: 'zh_CN',
    source: 'zh_CN',
    outDir: 'zh_CN',
    label: '简体中文',
    title: 'Luna Flow 文档',
    description: '这里聚合了 Luna-Flow 各仓库的标准化文档。',
    heroName: 'Luna Flow',
    heroText: 'MoonBit 可组合数学计算生态',
    heroTagline: '围绕代数抽象、数值可靠性和生态互操作性构建现代科学计算基础。',
    heroPrimary: '浏览文档',
    heroSecondary: 'GitHub',
    heroSecondaryLink: 'https://github.com/Luna-Flow',
    navText: '首页',
    overviewText: '概览',
    standardText: '文档规范',
    docsText: '文档',
    docsIndexTitle: '文档总导航',
    docsIndexDescription: '从统一入口浏览 Luna-Flow 各仓库的标准化文档。',
    lang: 'zh-CN',
  },
  {
    id: 'ja_JP',
    source: 'ja_JP',
    outDir: 'ja_JP',
    label: '日本語',
    title: 'Luna Flow ドキュメント',
    description: 'このサイトは Luna-Flow 各リポジトリの標準化ドキュメントを集約します。',
    heroName: 'Luna Flow',
    heroText: 'MoonBit 向け可組合せ数学エコシステム',
    heroTagline: '代数抽象、数値的信頼性、そしてエコシステム相互運用性を中核にした現代的な科学計算基盤です。',
    heroPrimary: 'ドキュメントを見る',
    heroSecondary: 'GitHub',
    heroSecondaryLink: 'https://github.com/Luna-Flow',
    navText: 'ホーム',
    overviewText: '概要',
    standardText: '文書規約',
    docsText: 'ドキュメント',
    docsIndexTitle: 'ドキュメント総合案内',
    docsIndexDescription: 'Luna-Flow 各リポジトリの標準化ドキュメントを単一入口から横断できます。',
    lang: 'ja-JP',
  },
];

function rmrf(target) {
  fs.rmSync(target, { recursive: true, force: true });
}

function mkdirp(target) {
  fs.mkdirSync(target, { recursive: true });
}

function listDirSafe(target) {
  return fs.existsSync(target) ? fs.readdirSync(target, { withFileTypes: true }) : [];
}

function resolveDocumentationTarget(target) {
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) return target;

  const markdownFiles = listDirSafe(target)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const preferred = ['index.md', 'api.md', 'design.md', 'tutorial.md'];
  const entry = preferred.find((name) => markdownFiles.includes(name)) ?? markdownFiles[0];
  return entry ? path.join(target, entry) : target;
}

function localePrefix(locale) {
  return locale.outDir ? `/${locale.outDir}` : '';
}

function docsIndexLink(locale) {
  const prefix = localePrefix(locale);
  return prefix ? `${prefix}/docs/` : '/docs/';
}

function rewriteLinks(content, repo, source) {
  const repositoryRoot = path.join(workspaceRoot, repo);

  return content.replace(/(?<!!)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (match, target, title = '') => {
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) return match;

    const suffixIndex = target.search(/[?#]/);
    const pathname = suffixIndex === -1 ? target : target.slice(0, suffixIndex);
    const suffix = suffixIndex === -1 ? '' : target.slice(suffixIndex);
    const resolved = resolveDocumentationTarget(path.resolve(path.dirname(source), pathname));
    const relativeToRepo = path.relative(repositoryRoot, resolved).split(path.sep).join('/');

    if (relativeToRepo.startsWith('../')) return match;

    const docMatch = relativeToRepo.match(/^doc\/(en_US|zh_CN|ja_JP)\/(.+)$/);
    if (docMatch) {
      const locale = locales.find((item) => item.source === docMatch[1]);
      let docPath = docMatch[2].replace(/\.md$/, '');
      if (docPath === 'README') docPath = 'index';
      if (docPath === 'doc_standard') docPath = 'doc-standard';
      return `](${localePrefix(locale)}/${repo}/${docPath}${suffix}${title})`;
    }

    const githubTarget = `https://github.com/Luna-Flow/${repo}/blob/main/${relativeToRepo}${suffix}`;
    return `](${githubTarget}${title})`;
  });
}

function writeMarkdownFile(file, content) {
  mkdirp(path.dirname(file));
  fs.writeFileSync(file, content.endsWith('\n') ? content : `${content}\n`);
}

function copyFileWithFrontmatter(source, dest, title, repo) {
  const raw = rewriteLinks(
    fs.readFileSync(source, 'utf8').replace(/^---[\s\S]*?---\n/, ''),
    repo,
    source,
  );
  const body = raw.startsWith('# ') ? raw : `# ${title}\n\n${raw}`;
  writeMarkdownFile(dest, body);
}

function humanize(input) {
  return input
    .replace(/\.md$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function collectModuleFiles(localeDir) {
  const files = [];

  function walk(current, rel = '') {
    for (const entry of listDirSafe(current)) {
      const abs = path.join(current, entry.name);
      const nextRel = rel ? path.join(rel, entry.name) : entry.name;
      if (entry.isDirectory()) {
        walk(abs, nextRel);
      } else if (entry.isFile() && entry.name.endsWith('.md') && rel) {
        files.push(nextRel);
      }
    }
  }

  walk(localeDir);
  return files.sort();
}

function collectExtraRootFiles(localeDir) {
  return listDirSafe(localeDir)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .filter((name) => !['README.md', 'doc_standard.md'].includes(name))
    .sort();
}

function linkFor(locale, repo, relPath) {
  const cleanRel = relPath.replace(/\.md$/, '').split(path.sep).join('/');
  const prefix = localePrefix(locale);
  return `${prefix}/${repo}/${cleanRel}`;
}

function docTypeLabel(locale, fileName) {
  const stem = fileName.replace(/\.md$/, '');
  const fixed = {
    api: { root: 'API', zh_CN: 'API', ja_JP: 'API' },
    design: { root: 'Design', zh_CN: '设计', ja_JP: '設計' },
    tutorial: { root: 'Tutorial', zh_CN: '教程', ja_JP: 'チュートリアル' },
    integration: { root: 'Integration', zh_CN: '集成', ja_JP: '統合' },
  };
  return fixed[stem]?.[locale.id] ?? humanize(stem);
}

function docTypeOrder(fileName) {
  const order = ['api.md', 'design.md', 'tutorial.md'];
  const index = order.indexOf(fileName);
  return index === -1 ? order.length : index;
}

function packageTreeItems(locale, repo, entries) {
  const root = new Map();

  for (const entry of entries) {
    const packageParts = path.dirname(entry).split(path.sep).filter((part) => part !== '.');
    let level = root;
    for (const [index, part] of packageParts.entries()) {
      if (!level.has(part)) level.set(part, { children: new Map(), link: null });
      const node = level.get(part);
      if (index === packageParts.length - 1) node.link = linkFor(locale, repo, entry);
      level = node.children;
    }
  }

  function render(level) {
    return [...level.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, node]) => {
        const item = { text: humanize(name) };
        if (node.link) item.link = node.link;
        if (node.children.size) item.items = render(node.children);
        return item;
      });
  }

  return render(root);
}

function buildSidebarItems(locale, repo, files) {
  const items = [
    { text: locale.overviewText, link: `${localePrefix(locale)}/${repo}/index` || `/${repo}/index` },
    { text: locale.standardText, link: `${localePrefix(locale)}/${repo}/doc-standard` || `/${repo}/doc-standard` },
  ];

  const groups = new Map();
  for (const rel of files) {
    const fileName = path.basename(rel);
    if (!groups.has(fileName)) groups.set(fileName, []);
    groups.get(fileName).push(rel);
  }

  const orderedGroups = [...groups.entries()].sort(([left], [right]) => {
    const orderDifference = docTypeOrder(left) - docTypeOrder(right);
    return orderDifference || left.localeCompare(right);
  });

  for (const [fileName, entries] of orderedGroups) {
    items.push({
      text: docTypeLabel(locale, fileName),
      collapsed: fileName !== 'api.md',
      items: packageTreeItems(locale, repo, entries),
    });
  }

  return items;
}

function docsSections(locale) {
  if (locale.id === 'root') {
    return [
      {
        heading: 'Vision',
        body: [
          'LunaFlow envisions MoonBit as a language capable of supporting serious mathematical software: from lightweight numerical utilities to rigorous scientific computing, symbolic manipulation, and future proof-oriented systems.',
          'We believe a mathematical ecosystem should not be built as a pile of unrelated APIs. It should be organized around precise abstractions:',
          '',
          '* algebraic structures such as monoids, rings, fields, and integral domains;',
          '* arithmetic capabilities such as square root, exponential, logarithmic, and trigonometric functions;',
          '* generic constructions such as complex numbers, vectors, matrices, and polynomials;',
          '* multiple numerical semantics, including machine floating point, arbitrary precision, decimal arithmetic, and error-aware computation.',
          '',
          'With this architecture, one algorithm can be written once and reused across different mathematical worlds.',
        ],
      },
      {
        heading: 'Mission',
        body: [
          'LunaFlow’s mission is to provide a foundational mathematical interoperability layer for MoonBit.',
          '',
          '1. Building reusable algebraic and arithmetic traits.',
          '2. Providing generic mathematical data structures.',
          '3. Supporting multiple numerical backends.',
          '4. Allowing external MoonBit math libraries to join the ecosystem through lightweight adapters.',
          '5. Making advanced mathematical computation more reliable, modular, and accessible.',
          '',
          'LunaFlow is not designed as a closed framework. Existing libraries should not need to be rewritten from scratch to participate. If a library can expose the required mathematical capabilities, LunaFlow should be able to integrate it into higher-level abstractions such as complex numbers, linear algebra, and future symbolic computation.',
        ],
      },
      {
        heading: 'Design Philosophy',
        body: [
          '**Abstraction before implementation.** Mathematical software should begin with clear structures and laws. Implementation details matter, but they should not leak into every layer of the ecosystem.',
          '',
          '**Small traits, strong composition.** Instead of defining one oversized numeric interface, LunaFlow separates algebraic structures from analytic capabilities. This keeps abstractions flexible and avoids forcing every type into an unsuitable model.',
          '',
          '**Semantics must be explicit.** A floating-point number, an arbitrary-precision value, a decimal value, and an interval-like value may all support arithmetic, but they do not mean the same thing. LunaFlow aims to preserve these semantic differences rather than hiding them behind a single vague interface.',
          '',
          '**Interoperability over isolation.** MoonBit’s mathematical ecosystem should allow independent libraries to work together. LunaFlow provides the common language that lets different packages become part of the same computational world.',
          '',
          '**One algorithm, many mathematical worlds.** A well-designed generic algorithm should be reusable across different numeric representations. LunaFlow makes this possible through trait-based abstraction and carefully layered packages.',
        ],
      },
      {
        heading: 'Long-Term Goal',
        body: [
          'The long-term goal of LunaFlow is to become a foundation for advanced mathematical computing in MoonBit.',
          '',
          '* generic algebraic computation;',
          '* linear algebra over multiple scalar types;',
          '* arbitrary-precision and error-aware numerical computing;',
          '* complex numbers over generic base fields;',
          '* polynomial and symbolic computation;',
          '* computable real numbers and more rigorous numerical models;',
          '* scientific computing applications built on top of a shared mathematical core.',
          '',
          'LunaFlow is still evolving, but its direction is clear: to turn MoonBit’s abstraction capabilities into a real mathematical ecosystem.',
          '',
          'We are building not just a collection of math packages, but a composable foundation for future scientific computing in MoonBit.',
        ],
      },
    ];
  }

  if (locale.id === 'zh_CN') {
    return [
      {
        heading: '愿景',
        body: [
          'LunaFlow 希望把 MoonBit 推向一个能够承载严肃数学软件的语言平台：从轻量数值工具，到严格科学计算、符号处理，以及未来更偏证明导向的系统。',
          '我们认为，一个数学生态不应该只是互不相干 API 的堆叠，而应该围绕精确抽象来组织：',
          '',
          '* 诸如幺半群、环、域、整环等代数结构；',
          '* 诸如平方根、指数、对数、三角函数等算术能力；',
          '* 诸如复数、向量、矩阵、多项式等泛型构造；',
          '* 多种数值语义，包括机器浮点、任意精度、十进制算术和误差感知计算。',
          '',
          '有了这样的结构，同一个算法就可以在不同数学世界中复用。',
        ],
      },
      {
        heading: '使命',
        body: [
          'LunaFlow 的使命，是为 MoonBit 提供一层基础性的数学互操作基础设施。',
          '',
          '1. 构建可复用的代数与算术 traits。',
          '2. 提供泛型数学数据结构。',
          '3. 支持多种数值后端。',
          '4. 允许外部 MoonBit 数学库通过轻量适配器接入生态。',
          '5. 让更高级的数学计算变得更可靠、更模块化、更易使用。',
          '',
          'LunaFlow 不是一个封闭框架。现有库不应该为了加入生态而被迫完全重写。只要一个库能够暴露所需的数学能力，LunaFlow 就应该能把它接入更高层抽象，例如复数、线性代数以及未来的符号计算。',
        ],
      },
      {
        heading: '设计哲学',
        body: [
          '**先抽象，后实现。** 数学软件应从清晰的结构与定律出发。实现细节当然重要，但不应泄漏到生态的每一层。',
          '',
          '**小 trait，强组合。** LunaFlow 不定义一个臃肿的大一统数值接口，而是把代数结构与分析能力拆开。这让抽象更灵活，也避免把所有类型硬塞进不合适的模型。',
          '',
          '**语义必须显式。** 浮点数、任意精度值、十进制值和区间式值都可能支持算术，但它们的数学含义并不相同。LunaFlow 的目标是保留这些差异，而不是用一个模糊接口把它们抹平。',
          '',
          '**互操作优先于孤岛。** MoonBit 的数学生态应该允许独立库协同工作。LunaFlow 提供的就是那套公共语言，让不同包能够进入同一个计算世界。',
          '',
          '**一个算法，多种数学世界。** 一个设计良好的泛型算法，应该能够跨不同数值表示复用。LunaFlow 通过 trait 抽象和分层包设计，使这件事真正可行。',
        ],
      },
      {
        heading: '长期目标',
        body: [
          'LunaFlow 的长期目标，是成为 MoonBit 高级数学计算的基础设施。',
          '',
          '* 泛型代数计算；',
          '* 面向多种标量类型的线性代数；',
          '* 任意精度与误差感知数值计算；',
          '* 基于泛型底层域的复数计算；',
          '* 多项式与符号计算；',
          '* 可计算实数与更严格的数值模型；',
          '* 建立在统一数学核心之上的科学计算应用。',
          '',
          'LunaFlow 仍在演进，但方向已经很清晰：把 MoonBit 的抽象能力真正转化为一个数学计算生态。',
          '',
          '我们要构建的不只是一些数学包，而是一套面向未来科学计算的可组合基础。',
        ],
      },
    ];
  }

  return [
    {
      heading: 'ビジョン',
      body: [
        'LunaFlow は、MoonBit を本格的な数学ソフトウェアを支えられる言語へ育てることを目指しています。軽量な数値ユーティリティから、厳密な科学計算、記号操作、そして将来的な証明志向システムまでを視野に入れています。',
        '私たちは、数学エコシステムは無関係な API の寄せ集めであってはならず、正確な抽象を中心に構成されるべきだと考えています。',
        '',
        '* モノイド、環、体、整域などの代数構造；',
        '* 平方根、指数、対数、三角関数などの算術能力；',
        '* 複素数、ベクトル、行列、多項式などの汎用構成；',
        '* 機械浮動小数点、任意精度、十進演算、誤差認識計算を含む複数の数値意味論。',
        '',
        'このアーキテクチャがあれば、1 つのアルゴリズムを異なる数学的世界で再利用できます。',
      ],
    },
    {
      heading: 'ミッション',
      body: [
        'LunaFlow の使命は、MoonBit のための基礎的な数学相互運用レイヤーを提供することです。',
        '',
        '1. 再利用可能な代数・算術 traits を構築すること。',
        '2. 汎用的な数学データ構造を提供すること。',
        '3. 複数の数値バックエンドを支えること。',
        '4. 外部の MoonBit 数学ライブラリが軽量アダプタでエコシステムに参加できるようにすること。',
        '5. 高度な数学計算を、より信頼でき、モジュール化され、扱いやすいものにすること。',
        '',
        'LunaFlow は閉じたフレームワークとして設計されていません。既存ライブラリは、参加するためにゼロから書き直す必要はありません。必要な数学能力を公開できるなら、LunaFlow はそれを複素数、線形代数、将来の記号計算といった高レベル抽象へ統合できるべきです。',
      ],
    },
    {
      heading: '設計哲学',
      body: [
        '**実装より先に抽象。** 数学ソフトウェアは、明確な構造と法則から始まるべきです。実装詳細は重要ですが、エコシステムの全層に漏れ出すべきではありません。',
        '',
        '**小さな trait と強い合成。** LunaFlow は巨大な数値インターフェースを定義する代わりに、代数構造と解析能力を分離します。これにより抽象が柔軟になり、あらゆる型を不適切なモデルへ押し込むことを避けられます。',
        '',
        '**意味論は明示的でなければならない。** 浮動小数点、任意精度値、十進値、区間的な値は、すべて算術を持ち得ますが意味は同じではありません。LunaFlow は、その差を曖昧な単一インターフェースで隠すのではなく、保ったまま扱います。',
        '',
        '**孤立より相互運用。** MoonBit の数学エコシステムは、独立したライブラリ同士が協調できるべきです。LunaFlow は、そのための共通言語を提供します。',
        '',
        '**1 つのアルゴリズム、多くの数学的世界。** よく設計された汎用アルゴリズムは、異なる数値表現をまたいで再利用できるべきです。LunaFlow は trait ベースの抽象と慎重な層構造によってそれを可能にします。',
      ],
    },
    {
      heading: '長期目標',
      body: [
        'LunaFlow の長期目標は、MoonBit における高度な数学計算の基盤になることです。',
        '',
        '* 汎用代数計算；',
        '* 複数のスカラー型にまたがる線形代数；',
        '* 任意精度および誤差認識型の数値計算；',
        '* 汎用基礎体上の複素数計算；',
        '* 多項式および記号計算；',
        '* 計算可能実数や、より厳密な数値モデル；',
        '* 共通数学コアの上に構築される科学計算アプリケーション。',
        '',
        'LunaFlow はまだ進化の途中ですが、方向は明確です。MoonBit の抽象能力を、本物の数学エコシステムへ育てることです。',
        '',
        '私たちが作ろうとしているのは単なる数学パッケージ群ではなく、将来の科学計算に向けた可組合せの基盤です。',
      ],
    },
  ];
}

function featureCards(locale, repoCount) {
  if (locale.id === 'root') {
    return [
      {
        title: 'Shared Abstractions',
        details: 'Build around reusable algebraic and arithmetic traits instead of isolated numeric APIs.',
      },
      {
        title: 'Composability',
        details: `Connect ${repoCount} Luna-Flow repositories through one interoperable mathematical ecosystem.`,
      },
      {
        title: 'Multiple Semantics',
        details: 'Support floating-point, arbitrary-precision, polynomial, matrix, and future symbolic worlds without erasing their differences.',
      },
    ];
  }

  if (locale.id === 'zh_CN') {
    return [
      {
        title: '共享抽象',
        details: '围绕可复用的代数与算术 traits 构建，而不是堆叠彼此割裂的数值 API。',
      },
      {
        title: '可组合生态',
        details: `把 ${repoCount} 个 Luna-Flow 仓库接入同一个可互操作的数学计算生态。`,
      },
      {
        title: '多重语义',
        details: '同时支持浮点、任意精度、多项式、矩阵以及未来的符号世界，而不抹平它们的差异。',
      },
    ];
  }

  return [
    {
      title: '共有抽象',
      details: '孤立した数値 API ではなく、再利用可能な代数・算術 traits を中心に構築します。',
    },
    {
      title: '可組合せエコシステム',
      details: `${repoCount} 個の Luna-Flow リポジトリを 1 つの相互運用可能な数学エコシステムへ接続します。`,
    },
    {
      title: '複数の意味論',
      details: '浮動小数点、任意精度、多項式、行列、そして将来の記号的世界を、その差異を消さずに支えます。',
    },
  ];
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function localized(value, locale) {
  return value?.[locale.id] ?? value?.root ?? '';
}

function categorizedRepos(locale, repos) {
  const available = new Map(repos.map((repo) => [repo.repo, repo]));
  const assigned = new Set();
  const categories = [];

  for (const category of config.categories ?? []) {
    const categoryRepos = category.repos
      .filter((name) => available.has(name))
      .map((name) => available.get(name));
    for (const repo of categoryRepos) assigned.add(repo.repo);
    if (categoryRepos.length) {
      categories.push({
        id: category.id,
        title: localized(category.title, locale),
        description: localized(category.description, locale),
        repos: categoryRepos,
      });
    }
  }

  const unassigned = repos
    .filter((repo) => !assigned.has(repo.repo))
    .sort((left, right) => left.repo.localeCompare(right.repo));
  if (unassigned.length) {
    const fallback = {
      root: ['Other Libraries', 'Newly discovered repositories awaiting a curated category.'],
      zh_CN: ['其他库', '自动发现、尚待人工归类的新仓库。'],
      ja_JP: ['その他のライブラリ', '自動検出され、分類を待っている新しいリポジトリ。'],
    }[locale.id];
    categories.push({ id: 'other', title: fallback[0], description: fallback[1], repos: unassigned });
  }

  return categories;
}

function writeDocsIndex(locale, repos) {
  const categories = categorizedRepos(locale, repos);
  const eyebrow = {
    root: 'LIBRARY DIRECTORY',
    zh_CN: '库目录',
    ja_JP: 'ライブラリ一覧',
  }[locale.id];
  const body = [
    '---',
    'layout: page',
    'aside: false',
    'sidebar: false',
    'pageClass: library-directory-page',
    '---',
    '',
    '<div class="library-directory">',
    `  <p class="library-directory__eyebrow">${eyebrow}</p>`,
    `  <h1>${escapeHtml(locale.docsIndexTitle)}</h1>`,
    `  <p class="library-directory__intro">${escapeHtml(locale.docsIndexDescription)}</p>`,
    '',
    '  <div class="library-directory__groups">',
    ...categories.flatMap((category, index) => [
      '    <section class="library-group">',
      '      <header class="library-group__header">',
      `        <span class="library-group__number">${String(index + 1).padStart(2, '0')}</span>`,
      '        <div>',
      `          <h2>${escapeHtml(category.title)}</h2>`,
      `          <p>${escapeHtml(category.description)}</p>`,
      '        </div>',
      '      </header>',
      '      <div class="library-group__links">',
      ...category.repos.map((repo) =>
        `        <a class="library-link" href="${localePrefix(locale)}/${repo.repo}/index"><span>${escapeHtml(repo.repo)}</span><span aria-hidden="true">↗</span></a>`
      ),
      '      </div>',
      '    </section>',
    ]),
    '  </div>',
    '</div>',
    '',
  ].join('\n');

  const targetDir = locale.outDir ? path.join(generatedRoot, locale.outDir) : generatedRoot;
  const docsDir = path.join(targetDir, 'docs');
  writeMarkdownFile(path.join(docsDir, 'index.md'), body);
  writeMarkdownFile(path.join(docsDir, 'README.md'), body);
}

function writeLocaleIndex(locale, repos) {
  const features = featureCards(locale, repos.length);
  const sections = docsSections(locale);

  const body = [
    '---',
    'layout: home',
    '',
    'hero:',
    `  name: "${locale.heroName}"`,
    `  text: "${locale.heroText}"`,
    `  tagline: "${locale.heroTagline}"`,
    '  image:',
    '    src: "/logo.svg"',
    '    alt: "Luna Flow Logo"',
    '  actions:',
    `    - theme: brand`,
    `      text: "${locale.heroPrimary}"`,
    `      link: "${docsIndexLink(locale)}"`,
    `    - theme: alt`,
    `      text: "${locale.heroSecondary}"`,
    `      link: "${locale.heroSecondaryLink}"`,
    '',
    'features:',
    ...features.flatMap((feature) => [
      `  - title: "${feature.title}"`,
      `    details: "${feature.details}"`,
    ]),
    '---',
    '',
    ...sections.flatMap((section) => [
      `## ${section.heading}`,
      '',
      ...section.body,
      '',
    ]),
  ].join('\n');

  const targetDir = locale.outDir ? path.join(generatedRoot, locale.outDir) : generatedRoot;
  writeMarkdownFile(path.join(targetDir, 'index.md'), body);
  writeMarkdownFile(path.join(targetDir, 'README.md'), body);
}

function repositoryNames() {
  if (manifestPath) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.repositories;
  }

  return [...new Set((config.categories ?? []).flatMap((category) => category.repos))];
}

function documentationStatus(repoName) {
  const docRoot = path.join(workspaceRoot, repoName, 'doc');
  const localeDirs = locales.map((locale) => path.join(docRoot, locale.source));
  if (!localeDirs.some((localeDir) => fs.existsSync(localeDir))) return 'none';

  const complete = localeDirs.every((localeDir) =>
    fs.existsSync(path.join(localeDir, 'README.md'))
    && fs.existsSync(path.join(localeDir, 'doc_standard.md'))
    && collectModuleFiles(localeDir).length > 0
  );
  return complete ? 'complete' : 'incomplete';
}

rmrf(generatedRoot);
mkdirp(generatedRoot);
mkdirp(generatedDataDir);

const enabledRepos = repositoryNames()
  .flatMap((repo) => {
    const status = documentationStatus(repo);
    if (status === 'incomplete') {
      console.warn(`Skipping ${repo}: incomplete en_US, zh_CN, or ja_JP documentation package.`);
    }
    return status === 'complete' ? [{ repo, title: repo }] : [];
  })
  .sort((left, right) => left.repo.localeCompare(right.repo));
const siteData = { sidebars: {}, repos: [] };

for (const locale of locales) {
  writeLocaleIndex(locale, enabledRepos);
  writeDocsIndex(locale, enabledRepos);
  siteData.sidebars[locale.id] = [];
  const targetLocaleDir = locale.outDir ? path.join(generatedRoot, locale.outDir) : generatedRoot;

  for (const repo of enabledRepos) {
    const repoRootDir = path.join(workspaceRoot, repo.repo);
    const sourceBase = path.join(repoRootDir, 'doc', locale.source);
    const readme = path.join(sourceBase, 'README.md');
    const standard = path.join(sourceBase, 'doc_standard.md');
    const rootContributing = path.join(repoRootDir, 'CONTRIBUTING.md');
    if (!fs.existsSync(readme)) throw new Error(`Missing README for ${repo.repo} ${locale.source}`);
    if (!fs.existsSync(standard)) throw new Error(`Missing doc_standard for ${repo.repo} ${locale.source}`);

    const files = collectModuleFiles(sourceBase);
    const extraFiles = collectExtraRootFiles(sourceBase);
    if (files.length === 0) throw new Error(`No module docs found for ${repo.repo} ${locale.source}`);
    const targetBase = path.join(targetLocaleDir, repo.repo);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'index.md'), repo.title, repo.repo);
    copyFileWithFrontmatter(readme, path.join(targetBase, 'README.md'), repo.title, repo.repo);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc-standard.md'), `${repo.title} Documentation Standard`, repo.repo);
    copyFileWithFrontmatter(standard, path.join(targetBase, 'doc_standard.md'), `${repo.title} Documentation Standard`, repo.repo);

    if (fs.existsSync(rootContributing)) {
      copyFileWithFrontmatter(rootContributing, path.join(targetBase, 'CONTRIBUTING.md'), `${repo.title} Contributing`, repo.repo);
    }

    for (const extra of extraFiles) {
      copyFileWithFrontmatter(
        path.join(sourceBase, extra),
        path.join(targetBase, extra),
        `${repo.title} ${humanize(extra)}`,
        repo.repo,
      );
    }

    for (const rel of files) {
      copyFileWithFrontmatter(
        path.join(sourceBase, rel),
        path.join(targetBase, rel),
        `${repo.title} ${humanize(rel)}`,
        repo.repo,
      );
    }

    const sidebarItems = buildSidebarItems(locale, repo.repo, files);
    siteData.sidebars[locale.id].push({ text: repo.title, items: sidebarItems });
    siteData.repos.push({ locale: locale.id, repo: repo.repo, title: repo.title, files });
  }

}

writeMarkdownFile(
  path.join(generatedDataDir, 'site-data.mjs'),
  `export default ${JSON.stringify(siteData, null, 2)};\n`,
);
