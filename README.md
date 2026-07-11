# Luna Flow Documentation Site

This repository builds the multilingual documentation directory for the Luna-Flow organization.

## Repository discovery

The deployment workflow discovers repositories from the GitHub organization on every build. A repository is eligible when it is public, is not a fork, and is not listed in `docs/repo-docs.config.json` under `exclude`. Archived repositories remain eligible. Every eligible repository is fetched from `main`; branch overrides are intentionally unsupported.

The discovery result controls which repositories may be downloaded. The category configuration does not control discovery and must never be used as an allowlist. This separation prevents a private repository visible to the build token from entering the generated site.

Repositories without a `doc` directory are downloaded but omitted from the site. Once any supported locale directory exists, the repository must provide the standard files for all three locales:

- `doc/en_US/README.md` and `doc/en_US/doc_standard.md`
- `doc/zh_CN/README.md` and `doc/zh_CN/doc_standard.md`
- `doc/ja_JP/README.md` and `doc/ja_JP/doc_standard.md`

An incomplete multilingual document set fails the build instead of publishing a partial repository.

## Directory categories

The `/docs/` page is a curated capability directory. Edit only `categories` in `docs/repo-docs.config.json` to change category names, descriptions, repository grouping, or display order. Repository names are displayed without the `Luna-Flow/` prefix.

A discovered repository that has standard documentation but is absent from every category is placed in the localized “Other” category automatically. Therefore adding a repository to the organization does not require an immediate site configuration change.

## Repository navigation

Files below each locale directory are collected automatically. Root files such as `README.md` and `doc_standard.md` remain repository-level pages. Package documents are grouped globally by filename, with the following fixed leading order:

1. `api.md`
2. `design.md`
3. `tutorial.md`
4. any extension type, sorted by filename

Within each document type, the sidebar preserves the repository package directory tree. For example, `backends/default/api.md` appears as `API → Backends → Default`. New document types such as `integration.md` require no generator change.

## Repeatable workflow

CI performs these steps on every deployment:

1. Run `node scripts/discover-repos.mjs ../workspace/repositories.json` with `GH_TOKEN`.
2. Download every discovered repository from `main` into `../workspace`.
3. Run `LUNAFLOW_REPO_ROOT=../workspace LUNAFLOW_REPO_MANIFEST=../workspace/repositories.json npm run docs:prepare`.
4. Build VitePress.

For local development, place the categorized Luna-Flow repositories beside this repository and run `npm run docs:dev`. Without `LUNAFLOW_REPO_MANIFEST`, the generator uses the repository names already present in the category configuration; this prevents unrelated local or private directories from entering a development build. To reproduce CI discovery exactly, generate and pass a manifest. Deployment must always provide the discovery manifest.
