# レイヤーシステム仕様書

## 概要

レイヤーシステムは、描画を複数の層に分けて管理する機能です。各レイヤーは独立して描画・編集でき、重ね順の変更や新規追加が可能です。

## データ構造

### Layer型 (`types.ts`)

```typescript
interface Layer {
  id: string; // 一意のID
  name: string; // レイヤー名
  visible: boolean; // 表示/非表示（未実装）
  locked: boolean; // ロック状態（未実装）
  opacity: number; // 不透明度（未実装）
}
```

### DrawingLineとの関連

```typescript
interface DrawingLine {
  // ...
  layerId: string; // 所属レイヤーのID
}
```

各描画線（DrawingLine）は`layerId`プロパティを持ち、特定のレイヤーに所属します。

## 主要コンポーネント

### 1. レイヤーストア (`layer-store.ts`)

#### 状態管理Atom

- `layersAtom`: レイヤー配列を管理
- `currentLayerIdAtom`: 現在選択中のレイヤーID
- `currentLayerAtom`: 現在選択中のレイヤーオブジェクト（派生Atom）

#### 操作Atom

- `addLayerAtom`: 新しいレイヤーを追加
- `removeLayerAtom`: レイヤーを削除（UI未実装）
- `updateLayerAtom`: レイヤー情報を更新（UI未実装）
- `reorderLayersAtom`: レイヤーの順序を変更

#### デフォルトレイヤー

```typescript
const createDefaultLayer = (): Layer => ({
  id: generateId(),
  name: "Layer 1",
  visible: true,
  locked: false,
  opacity: 1,
});
```

初期状態では「Layer 1」という名前のレイヤーが1つ作成されます。

### 2. レイヤーリスト (`layer-list.tsx`)

#### 主な機能

1. **レイヤー一覧表示**: 現在のすべてのレイヤーを表示
2. **レイヤー選択**: クリックで現在のレイヤーを切り替え
3. **ドラッグ&ドロップ**: レイヤーの順序変更
4. **新規レイヤー追加**: 「+ Add Layer」ボタン
5. **レイヤー名編集**: Edit2アイコンをクリックして編集モード、Enter/Escapeキー対応
6. **表示/非表示切り替え**: Eyeアイコンで切り替え
7. **ロック/アンロック**: Lock/Unlockアイコンで切り替え
8. **レイヤー削除**: Trash2アイコンで削除（最低1レイヤーは保持）
9. **不透明度調整**: スライダーで0-100%の範囲で調整

#### ドラッグ&ドロップ実装

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (over && active.id !== over.id) {
    const oldIndex = layers.findIndex((layer) => layer.id === active.id);
    const newIndex = layers.findIndex((layer) => layer.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderLayers(oldIndex, newIndex);
    }
  }
};
```

`@dnd-kit`ライブラリを使用して、直感的なドラッグ&ドロップを実現。

### 3. ツールバー統合 (`tool-bar.tsx`)

```typescript
<Popover open={openLayers} onOpenChange={setOpenLayers}>
  <PopoverTrigger asChild>
    <Toggle>
      <Layers className="h-4 w-4" />
      <span className="ml-2">
        {layers.find((l) => l.id === currentLayerId)?.name || ""}
      </span>
    </Toggle>
  </PopoverTrigger>
  <PopoverContent>
    <LayerList onClose={() => setOpenLayers(false)} />
  </PopoverContent>
</Popover>
```

- Layersアイコンと現在のレイヤー名を表示
- クリックでポップオーバーが開き、レイヤーリストを表示

## レイヤーと描画の関係

### 1. 描画時のレイヤー指定

新しい線を描画する際、現在選択中のレイヤーIDが自動的に設定されます：

```typescript
const newLine: DrawingLine = {
  // ...
  layerId: currentLayerId, // 現在のレイヤーに描画
};
```

### 2. レイヤー別描画（drawing-canvas.tsx）

```typescript
// レイヤーを逆順で描画（上位レイヤーが前面）
{[...layers].reverse().map((layer) => {
  const layerLines = linesByLayer[layer.id];
  return (
    <Layer key={layer.id}>
      {layerLines.map((line) => (
        <DrawingLineComponent ... />
      ))}
    </Layer>
  );
})}
```

- レイヤーは配列の逆順で描画（後のレイヤーが前面に表示）
- 各レイヤーは独立したKonvaのLayerコンポーネントとして描画

### 3. 選択ツールとの連携

- **選択制限**: 現在のレイヤーの線のみ選択可能
- **レイヤー単位の移動**: 一つの線を選択すると、同じレイヤーのすべての線が選択される
- **ホバー表示**: 現在のレイヤーの線のみホバー効果が表示される

## 機能の実装状況

### 実装済み機能

- ✅ レイヤーの追加
- ✅ レイヤーの選択・切り替え
- ✅ レイヤーの並び替え（ドラッグ&ドロップ）
- ✅ レイヤーごとの独立した描画
- ✅ レイヤー名の表示
- ✅ 最低1レイヤーの保持
- ✅ レイヤーの表示/非表示切り替え（Eyeアイコン）
- ✅ レイヤーのロック機能（Lock/Unlockアイコン）
- ✅ レイヤーの不透明度調整（スライダーで0-100%）
- ✅ レイヤーの削除UI（Trash2アイコン、最低1レイヤーは保持）
- ✅ レイヤー名の編集UI（Edit2アイコン、Enter/Escapeキー対応）

## 新規レイヤー作成フロー

1. ユーザーが「+ Add Layer」ボタンをクリック
2. `addLayerAtom`が実行される：
   ```typescript
   const newLayer: Layer = {
     id: generateId(),
     name: `Layer ${layers.length + 1}`, // 連番で名前を生成
     visible: true,
     locked: false,
     opacity: 1,
   };
   ```
3. 新しいレイヤーが配列に追加
4. 自動的に新しいレイヤーが選択される
5. ポップオーバーが閉じる

## レイヤー機能の詳細

### 表示/非表示機能

- レイヤーの`visible`プロパティがfalseの場合、そのレイヤーは描画されない
- drawing-canvas.tsx内で`!layer.visible`の場合はレンダリングをスキップ

### ロック機能

- レイヤーの`locked`プロパティがtrueの場合、そのレイヤーへの描画・編集が不可
- Penツール、Eraserツール使用時にロックされたレイヤーには描画できない
- Selectツール使用時にロックされたレイヤーの線は選択・移動できない

### 不透明度機能

- レイヤーの`opacity`プロパティ（0-1の範囲）がKonvaのLayerコンポーネントに適用
- UIではスライダーで0-100%として表示・調整

## パフォーマンス考慮事項

- レイヤーごとにKonvaのLayerコンポーネントを使用することで、再描画を最適化
- 空のレイヤーはスキップして描画しない
- 非表示のレイヤーはレンダリングしない
- レイヤー数が増えてもパフォーマンスへの影響は限定的
