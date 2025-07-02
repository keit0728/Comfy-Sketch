# Undo/Redo機能仕様書

## 概要

Undo/Redo機能は、ユーザーの描画操作や移動操作を履歴として管理し、操作の取り消しややり直しを可能にする機能です。履歴は「過去」「現在」「未来」の3つの状態で管理されます。

## アーキテクチャ

### 履歴データ構造 (`history-store.ts`)

```typescript
interface HistoryState {
  past: DrawingLine[][]; // 過去の状態の配列
  present: DrawingLine[]; // 現在の状態
  future: DrawingLine[][]; // 未来の状態の配列（Redo用）
}
```

## 主要コンポーネント

### 1. 履歴ストア (`history-store.ts`)

#### 状態管理Atom

- `historyAtom`: 履歴全体の状態を管理
- `canUndoAtom`: Undo可能かどうかの判定（past.length > 0）
- `canRedoAtom`: Redo可能かどうかの判定（future.length > 0）

#### 操作Atom

- `pushHistoryAtom`: 新しい状態を履歴に追加
- `undoAtom`: 一つ前の状態に戻す
- `redoAtom`: 一つ後の状態に進む
- `initializeHistoryAtom`: 履歴を初期化

### 2. UI実装 (`tool-bar.tsx`)

```typescript
const undo = useSetAtom(undoAtom);
const redo = useSetAtom(redoAtom);
const canUndo = useAtomValue(canUndoAtom);
const canRedo = useAtomValue(canRedoAtom);
```

- Undoボタン: `Undo2`アイコン、`canUndo`がfalseの時は無効化
- Redoボタン: `Redo2`アイコン、`canRedo`がfalseの時は無効化

## 動作仕様

### 1. 履歴の追加（pushHistory）

```typescript
export const pushHistoryAtom = atom(
  null,
  (get, set, newLines: DrawingLine[]) => {
    const history = get(historyAtom);
    set(historyAtom, {
      past: [...history.past, history.present], // 現在の状態を過去に追加
      present: newLines, // 新しい状態を現在に設定
      future: [], // 未来をクリア
    });
  },
);
```

**重要**: 新しい操作を行うと、future（Redo履歴）はクリアされます。

### 2. Undo処理

```typescript
export const undoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.past.length === 0) return;

  const previous = history.past[history.past.length - 1];
  const newPast = history.past.slice(0, history.past.length - 1);

  set(historyAtom, {
    past: newPast, // 最後の要素を除いた過去
    present: previous, // 過去の最後の状態を現在に
    future: [history.present, ...history.future], // 現在の状態を未来に追加
  });
});
```

### 3. Redo処理

```typescript
export const redoAtom = atom(null, (get, set) => {
  const history = get(historyAtom);
  if (history.future.length === 0) return;

  const next = history.future[0];
  const newFuture = history.future.slice(1);

  set(historyAtom, {
    past: [...history.past, history.present], // 現在の状態を過去に追加
    present: next, // 未来の最初の状態を現在に
    future: newFuture, // 最初の要素を除いた未来
  });
});
```

## 統合実装 (`view.tsx`)

### 1. 履歴の初期化

```typescript
// コンポーネントマウント時に空の履歴で初期化
useEffect(() => {
  initializeHistory([]);
}, [initializeHistory]);
```

### 2. 履歴と描画状態の同期

```typescript
// history.presentが変更されたらlocalLinesを更新
useEffect(() => {
  setLocalLines(history.present);
}, [history.present]);
```

この同期により、Undo/Redo実行時に自動的に画面が再描画されます。

### 3. 履歴への保存タイミング

```typescript
const handleMouseUp = useCallback(() => {
  if (isDrawing || isDragging) {
    // 描画またはドラッグ操作完了時に履歴に保存
    pushHistory(localLines);
  }
  // ...
}, [...]);
```

### 4. キーボードショートカット

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Undo: Ctrl/Cmd + Z
    if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey && canUndo) {
      e.preventDefault();
      undo();
    }
    // Redo: Ctrl/Cmd + Shift + Z または Ctrl/Cmd + Y
    else if (
      ((e.metaKey || e.ctrlKey) && e.key === "z" && e.shiftKey && canRedo) ||
      ((e.metaKey || e.ctrlKey) && e.key === "y" && canRedo)
    ) {
      e.preventDefault();
      redo();
    }
  };
  // ...
}, [undo, redo, canUndo, canRedo]);
```

## データフロー

1. **描画開始**: `localLines`に新しい線を追加（履歴には未保存）
2. **描画中**: `localLines`の最後の線を更新（履歴には未保存）
3. **描画完了**: `pushHistory(localLines)`で履歴に保存
4. **Undo実行**:
   - `history.present`が前の状態に変更
   - `useEffect`により`localLines`が自動更新
   - 画面が再描画される
5. **Redo実行**:
   - `history.present`が次の状態に変更
   - 同様に自動的に画面が更新

## 対象となる操作

履歴に保存される操作：

- Penツールでの描画
- Eraserツールでの消去
- Selectツールでの線の移動

履歴に保存されない操作：

- ツールの切り替え
- ブラシサイズの変更
- 色の変更
- レイヤーの切り替え

## パフォーマンス考慮事項

- 履歴は描画データ全体のスナップショットとして保存
- メモリ使用量は履歴の深さと描画データ量に比例
- 実装上の履歴数制限は設けていない（必要に応じて追加可能）
