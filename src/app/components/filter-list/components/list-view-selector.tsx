import { XMarkIcon } from '@heroicons/react/24/outline';

import { useFilterList } from '../filter-list-context';
import { FilterView } from '../types';

export const ViewSelector = () => {
  const {
    activeView,
    setActiveView,
    setSearchTerm,
    setSelectedIndex,
    onClose,
  } = useFilterList();
  const handleViewChange = (view: FilterView) => {
    setActiveView(view);
    setSearchTerm('');
    setSelectedIndex(-1);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => handleViewChange('tag')}
        className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
          activeView === 'tag' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
        }`}
      >
        Tag
      </button>
      <button
        type="button"
        onClick={() => handleViewChange('size')}
        className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
          activeView === 'size' ? 'bg-white shadow-sm' : 'hover:bg-slate-300'
        }`}
      >
        Size
      </button>
      <button
        type="button"
        onClick={() => handleViewChange('filetype')}
        className={`flex-auto cursor-pointer items-center rounded-sm px-2 py-1 transition-colors ${
          activeView === 'filetype'
            ? 'bg-white shadow-sm'
            : 'hover:bg-slate-300'
        }`}
      >
        Filetype
      </button>
      <button
        onClick={onClose}
        className="ml-2 cursor-pointer rounded-full p-1 transition-colors hover:bg-slate-200"
        title="Close filter list"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </>
  );
};
