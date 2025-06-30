# Eraserツール仕様書

## 概要
Eraserツールは、キャンバス上に描かれた線を消去するための描画ツールです。技術的には、透明な線を描画することで既存の描画を消去します。

## 主要コンポーネント

### 1. ツールバー (`tool-bar.tsx`)
- **場所**: `/src/app/[locale]/(components)/tool-bar.tsx`
- **機能**: 
  - Eraserツールの選択ボタンを提供
  - アイコン: Eraser (lucide-react)
  - Toggleコンポーネントで実装され、選択時は `data-[state=on]` スタイルが適用される

### 2. 状態管理
- Eraserツールは、Penツールと同じ状態管理システムを使用
- `currentToolAtom`の値が "eraser" になることで識別
- ブラシサイズ（`brushSizeAtom`）を共有するが、実際の太さは2倍になる

## 動作仕様

### 描画開始 (handleMouseDown)
Eraserツールが選択されている状態でマウスボタンを押下した時：

```typescript
const newLine: DrawingLine = {
  id: generateId(),
  points: [point.x, point.y, point.x, point.y],
  color: "black",              // 常に黒色
  strokeWidth: brushSize * 2,  // ブラシサイズの2倍
  tool: "eraser",              // ツール種別
  layerId: currentLayerId,
};
```

### 特殊な設定
1. **色**: 常に "black" に固定
   - globalCompositeOperationとの組み合わせで消去効果を実現するため

2. **線の太さ**: `brushSize * 2`
   - 通常のPenツールより太く設定され、消去しやすくする

3. **tool属性**: "eraser" を設定
   - 描画時の特別な処理を識別するため

### 描画中・描画終了
- Penツールと同じ処理フロー
- マウス移動時に座標をpoints配列に追加
- マウスボタンを離すと履歴に保存

## 描画表示の仕組み

### DrawingLine (`drawing-line.tsx`)
Eraserツールの最も重要な部分は、Konva.jsの`globalCompositeOperation`の設定です：

```typescript
globalCompositeOperation={
  line.tool === "eraser" ? "destination-out" : "source-over"
}
```

- **"destination-out"**: 既存のピクセルを削除する合成モード
- これにより、黒色の線が「消しゴム」として機能する

### 視覚的フィードバックの制限
Eraserツールで描画された線には以下の制限があります：

1. **選択不可**: `lines[i].tool !== "eraser"` の条件により、選択ツールで選択できない
2. **ハイライト表示なし**: 選択時・ホバー時の青い枠線表示がされない
3. **移動不可**: 選択できないため、移動もできない

```typescript
// 選択時のハイライト表示（eraserの場合は表示されない）
{isSelected && line.tool !== "eraser" && (
  <Line ... />
)}

// ホバー時のハイライト表示（eraserの場合は表示されない）
{isHovered && !isSelected && line.tool !== "eraser" && (
  <Line ... />
)}
```

## レイヤー対応
- Eraserツールも現在選択中のレイヤーに対して動作
- 消去効果は同じレイヤー内の描画にのみ影響する
- 選択ツールでレイヤー単位の移動時、消去線も一緒に移動する

## パフォーマンスとデータ管理
- Eraserの「線」も通常の線と同様にDrawingLineオブジェクトとして保存
- Undo/Redo機能で消去操作も取り消し可能
- 消去は実際にデータを削除するのではなく、透明な線を重ねる方式

## 技術的な詳細

### なぜ "destination-out" を使用するのか
- Canvas APIの合成モードを利用して、ピクセルレベルで消去を実現
- 既存の描画データを保持したまま、視覚的に消去効果を提供
- Undo/Redo機能との互換性を保つ

### ブラシサイズが2倍になる理由
- ユーザビリティの観点から、消去時はより広い範囲を消せるようにする
- Penツールと同じサイズ設定を使いながら、実効的により太い消しゴムを提供