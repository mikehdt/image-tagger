import { XIcon } from 'lucide-react';

import { SegmentedControl } from '@/app/components/shared/segmented-control/segmented-control';

import { useFilterContext } from '../filter-context';
import { FilterView } from '../types';

const viewOptions: { value: FilterView; label: string }[] = [
  { value: 'tag', label: 'Tag' },
  { value: 'size', label: 'Size' },
  { value: 'filetype', label: 'File' },
];

export const ViewSelector = () => {
  const { activeView, setActiveView, setSearchTerm, setSelectedIndex, onClose } =
    useFilterContext();

  const handleViewChange = (view: FilterView) => {
    setActiveView(view);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  return (
    <>
      <SegmentedControl
        options={viewOptions}
        value={activeView}
        onChange={handleViewChange}
      />

      <button
        onClick={onClose}
        className="ml-2 cursor-pointer rounded-full p-1 transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
        title="Close filter list"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </>
  );
};
