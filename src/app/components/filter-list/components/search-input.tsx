import { XMarkIcon } from '@heroicons/react/24/outline';

import { useSearch } from '../search-context';

export const SearchInput = () => {
  const { activeView, searchTerm, setSearchTerm, handleKeyDown, inputRef } =
    useSearch();
  return (
    <>
      <input
        ref={inputRef}
        type="text"
        className="w-full rounded-full border border-slate-300 bg-white py-1 ps-4 pe-8 transition-all"
        autoFocus
        placeholder={`Search for ${activeView === 'tag' ? 'tag' : 'size'}`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <span
        className={`absolute top-1.5 right-4 h-5 w-5 cursor-pointer rounded-full p-0.5 ${
          searchTerm.trim() !== ''
            ? 'text-slate-600 hover:bg-slate-500 hover:text-white'
            : 'cursor-not-allowed text-gray-300'
        }`}
        onClick={searchTerm.trim() !== '' ? () => setSearchTerm('') : undefined}
      >
        <XMarkIcon />
      </span>
    </>
  );
};
