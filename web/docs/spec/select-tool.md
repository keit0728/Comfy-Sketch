# Selectツール仕様書

## 概要

Selectツールは、キャンバス上に描かれた線を選択し、移動させるためのツールです。レイヤー単位での選択と移動をサポートし、消しゴムの線を除く通常の描画線のみを選択対象とします。

## 主要コンポーネント

### 1. ツールバー (`tool-bar.tsx`)

- **場所**: `/src/app/[locale]/(components)/tool-bar.tsx`
- **機能**:
  - Selectツールの選択ボタンを提供
  - アイコン: MousePointer (lucide-react)
  - Toggleコンポーネントで実装され、選択時は `data-[state=on]` スタイルが適用される

### 2. 状態管理 (`tool-store.ts`)

- `selectedLineIdAtom`: 選択された線のID（単一）
- `selectedLineIdsAtom`: 選択された線のID配列（レイヤー単位の複数選択用）

### 3. ローカル状態 (`view.tsx`)

- `isDragging`: ドラッグ中フラグ
- `dragStartPoint`: ドラッグ開始地点
- `hoveredLineIds`: ホバー中の線ID配列

## 動作仕様

### 1. 線の選択（クリック時）

#### handleMouseDown (112-141行目)

```typescript
if (currentTool === "select") {
  // 後ろから順に探索（上に描かれている線を優先）
  for (let i = lines.length - 1; i >= 0; i--) {
    if (
      lines[i].tool !== "eraser" && // 消しゴムの線は除外
      lines[i].layerId === currentLayerId && // 現在のレイヤーのみ
      isPointNearLine(point, lines[i]) // クリック位置との判定
    ) {
      clickedLineId = lines[i].id;
      clickedLine = lines[i];
      break;
    }
  }
}
```

選択時の処理：

1. **消しゴム線の除外**: `tool !== "eraser"` で消しゴムの線は選択対象外
2. **レイヤー制限**: 現在選択中のレイヤーの線のみ選択可能
3. **レイヤー単位の選択**: 一つの線をクリックすると、同じレイヤーのすべての線（消しゴム含む）が選択される

### 2. ホバー表示

#### handleMouseMove (180-202行目)

```typescript
if (currentTool === "select" && !isDragging) {
  // ホバー対象の線を探す（消しゴム線は除外）
  for (let i = lines.length - 1; i >= 0; i--) {
    if (
      lines[i].tool !== "eraser" &&
      lines[i].layerId === currentLayerId &&
      isPointNearLine(point, lines[i])
    ) {
      hoveredLine = lines[i];
      break;
    }
  }

  if (hoveredLine) {
    // 同じレイヤーのすべての線をホバー表示
    const sameLayerLineIds = lines
      .filter((line) => line.layerId === hoveredLine.layerId)
      .map((line) => line.id);
    setHoveredLineIds(sameLayerLineIds);
  }
}
```

### 3. ドラッグ移動

#### handleMouseMove (204-223行目)

```typescript
if (isDragging && selectedLineIds.length > 0 && dragStartPoint) {
  const dx = point.x - dragStartPoint.x;
  const dy = point.y - dragStartPoint.y;

  setLocalLines((prevLines) =>
    prevLines.map((line) => {
      if (selectedLineIds.includes(line.id)) {
        // 各座標点を移動
        const newPoints = [];
        for (let i = 0; i < line.points.length; i += 2) {
          newPoints.push(line.points[i] + dx); // X座標
          newPoints.push(line.points[i + 1] + dy); // Y座標
        }
        return { ...line, points: newPoints };
      }
      return line;
    }),
  );

  setDragStartPoint(point); // 次のフレームの基準点を更新
}
```

### 4. 選択解除

#### handleMouseUp (260-263行目)

```typescript
if (currentTool === "select") {
  setSelectedLineId(null);
  setSelectedLineIds([]);
}
```

## 線の当たり判定

### isPointNearLine関数 (`utils.ts`)

```typescript
export const isPointNearLine = (point: Point, line: DrawingLine) => {
  const threshold = line.strokeWidth / 2 + 5; // 線の太さの半分 + 5pxのマージン

  // 線分ごとに判定
  for (let i = 0; i < line.points.length - 2; i += 2) {
    // 点から線分への最短距離を計算
    // ...
    if (distance <= threshold) {
      return true;
    }
  }
  return false;
};
```

- 線の太さに応じた判定領域
- 追加の5pxマージンで選択しやすさを向上

## 視覚的フィードバック

### DrawingLine (`drawing-line.tsx`)

1. **選択時の表示**（31-42行目）
   - 青い枠線（#0066ff）
   - 元の線幅 + 4px
   - 不透明度: 0.3
   - 消しゴム線は表示されない

2. **ホバー時の表示**（43-54行目）
   - 青い枠線（#0066ff）
   - 元の線幅 + 4px
   - 不透明度: 0.25
   - 消しゴム線は表示されない

## レイヤー連携

### レイヤー単位の選択理由

1. **一貫性のある操作**: 同じレイヤーに属する要素は一つのグループとして扱う
2. **消しゴムの関連性**: 消しゴムの線も同じレイヤーの一部として移動
3. **レイヤー間の独立性**: 異なるレイヤーの要素は影響を受けない

### 現在のレイヤー制限

- 選択可能な線は現在選択中のレイヤーのみ
- 他のレイヤーの線は選択・ホバー対象外

## パフォーマンス最適化

1. **逆順探索**: 最後に描かれた（上に表示される）線から探索
2. **早期終了**: 最初に見つかった線で探索を終了
3. **マウス移動のスロットリング**: 16ms間隔（約60fps）で処理

## 履歴管理

- ドラッグ完了時（mouseUp）に履歴に保存
- Undo/Redoで移動操作を取り消し可能
