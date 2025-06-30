# Penツール仕様書

## 概要
Penツールは、キャンバス上に自由に線を描画するための基本的な描画ツールです。

## 主要コンポーネント

### 1. ツールバー (`tool-bar.tsx`)
- **場所**: `/src/app/[locale]/(components)/tool-bar.tsx`
- **機能**: 
  - Penツールの選択ボタンを提供
  - アイコン: Pencil (lucide-react)
  - Toggleコンポーネントで実装され、選択時は `data-[state=on]` スタイルが適用される

### 2. 状態管理 (`tool-store.ts`)
- **場所**: `/src/stores/tool-store.ts`
- **管理する状態**:
  - `currentToolAtom`: 現在選択中のツール ("pen" | "eraser" | "select")
  - `brushSizeAtom`: ブラシサイズ (デフォルト: 3px)
  - `brushColorAtom`: ブラシカラー (デフォルト: "#000000")

## データ構造

### DrawingLine型 (`types.ts`)
```typescript
interface DrawingLine {
  id: string;           // 一意のID
  points: number[];     // 座標配列 [x1, y1, x2, y2, ...]
  color: string;        // 線の色
  strokeWidth: number;  // 線の太さ
  tool: "pen" | "eraser"; // 使用ツール
  layerId: string;      // 所属レイヤーID
}
```

## 動作仕様

### 描画開始 (handleMouseDown)
1. Penツールが選択されている状態でマウスボタンを押下
2. 新しいDrawingLineオブジェクトを作成:
   - ID: `generateId()`で生成
   - 初期座標: クリック位置を2回格納 `[x, y, x, y]`
   - 色: `brushColor`の値
   - 太さ: `brushSize`の値
   - ツール: "pen"
   - レイヤーID: 現在選択中のレイヤー
3. `isDrawing`フラグをtrueに設定
4. 作成したlineをlocalLinesに追加

### 描画中 (handleMouseMove)
1. `isDrawing`がtrueかつ`currentTool`が"select"でない場合
2. マウス移動のスロットリング（最小間隔制御）
3. localLinesの最後の要素（現在描画中の線）のpoints配列に新しい座標を追加
4. 新しい座標 `[x, y]` を配列の末尾に追加

### 描画終了 (handleMouseUp)
1. `isDrawing`フラグをfalseに設定
2. 履歴に現在の状態を保存（Undo/Redo機能用）
3. 描画した線が確定される

## 描画表示

### DrawingCanvas (`drawing-canvas.tsx`)
- Konva.jsのStageとLayerを使用
- レイヤーごとに線を管理・表示

### DrawingLine (`drawing-line.tsx`)
- 個別の線を描画するコンポーネント
- Konva.LineでPenツールの線を描画
- `globalCompositeOperation: "source-over"`で通常の描画モード

## 関連機能

### ブラシサイズ変更
- ツールバーのBrushSizeSelectorで1〜50pxの範囲で調整可能
- デフォルト: 3px

### カラー変更
- HTML5のカラーピッカーを使用
- ツールバーの色見本をクリックして変更

### レイヤー対応
- 各線は特定のレイヤーに所属
- 現在選択中のレイヤーに描画される

### 履歴機能
- 描画完了時に自動的に履歴に保存
- Undo/Redoで操作の取り消し・やり直しが可能

## パフォーマンス最適化
- マウス移動イベントのスロットリング処理
- React.useCallbackによる関数の最適化
- 配列操作時の新規オブジェクト作成による不変性の保持