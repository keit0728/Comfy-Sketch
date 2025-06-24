# ディレクトリ構成

以下のディレクトリ構造に従って実装を行ってください：

```
/
├── .cursor/                             # cursorの設定ファイル
├── messages/                            # 多言語ファイル
├── public/                              # 静的ファイル
├── src/                                 # ソースコードディレクトリ
│   ├── app/                             # Next.jsのアプリケーションディレクトリ
│   │   ├── [locale]/                    # ロケールごとのルーティング
│   │   │   ├── (components)             # 特定の画面専用のコンポーネント
│   │   │   ├── pathname/                # 各画面
│   │   │   │   ├── (components)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx               # 全画面共通処理
│   │   │   ├── page.tsx                 # 画面
│   │   │   └── loading.tsx              # 全画面共通のローディング画面
│   │   ├── favicon.ico                  # favicon
│   │   └── globals.css                  # グローバルスタイル
│   ├── components/                      # アプリケーションコンポーネント
│   │   ├── common/                      # 複数画面で使用する共通コンポーネント
│   │   └── ui/                          # shadcn/uiのコンポーネント
│   ├── configs/                         # 環境変数の型定義
│   ├── hooks/                           # カスタムフック
│   ├── i18n/                            # 多言語化設定
│   ├── lib/                             # 共通ロジック
│   ├── stores/                          # 状態管理
│   └── middleware.ts                    # ミドルウェア
├── .gitignore                           # Git除外設定
├── coding-rule.md                       # コーディング規約
├── directorystructure.md                # ディレクトリ構成
├── eslint.config.mjs                    # ESLint設定
├── next.config.ts                       # Next.js設定
├── package.json                         # プロジェクト設定
├── package-lock.json                    # 依存関係ロックファイル
├── postcss.config.mjs                   # PostCSS設定
├── technologystack.md/                  # 技術スタック
└── tsconfig.json                        # TypeScript設定
```
