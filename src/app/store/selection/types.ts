type LastClickAction = 'select' | 'deselect' | null;

interface SelectionState {
  selectedAssets: string[];
  // For shift-click range selection
  lastClickedAssetId: string | null;
  lastClickAction: LastClickAction;
}

export type { LastClickAction };

export const initialState: SelectionState = {
  selectedAssets: [],
  lastClickedAssetId: null,
  lastClickAction: null,
};
