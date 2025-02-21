type TagActionsProps = {
  clearChanges: () => void;
  saveFilters: () => void;
};

export const TagActions = ({ clearChanges, saveFilters }: TagActionsProps) => (
  <span className="ml-auto">
    <button
      className="rounded-xs bg-slate-200 px-4 py-1 hover:bg-slate-400"
      onClick={clearChanges}
    >
      Cancel
    </button>
    <button
      className="ml-2 rounded-xs bg-emerald-200 px-4 py-1 hover:bg-emerald-400"
      onClick={saveFilters}
    >
      Save
    </button>
  </span>
);
