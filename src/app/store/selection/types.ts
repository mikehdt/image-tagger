type LastClickAction = 'select' | 'deselect' | null;

interface SelectionState {
  selectedAssets: string[];
  // For shift-click range selection
  lastClickedAssetId: string | null;
  lastClickAction: LastClickAction;
  // For shift-hover preview (shows what would be selected/deselected)
  shiftHoverAssetId: string | null;
}

export type { LastClickAction };

export const initialState: SelectionState = {
  selectedAssets: [],
  lastClickedAssetId: null,
  lastClickAction: null,
  shiftHoverAssetId: null,
};
