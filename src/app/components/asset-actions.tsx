type AssetActionsProps = {
  onSave: () => void;
  onCancel: () => void;
};

export const AssetActions = ({ onSave, onCancel }: AssetActionsProps) => (
  <span className="ml-auto">
    <button
      className="cursor-pointer rounded-sm bg-slate-200 px-4 py-1 hover:bg-slate-400"
      onClick={onCancel}
    >
      Cancel
    </button>
    <button
      className="ml-2 cursor-pointer rounded-sm bg-emerald-200 px-4 py-1 hover:bg-emerald-400"
      onClick={onSave}
    >
      Save
    </button>
  </span>
);
