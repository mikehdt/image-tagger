import {
  FileImageIcon,
  FileSearchIcon,
  FolderOpenIcon,
  PlusIcon,
  XIcon,
} from 'lucide-react';

import { useFileView } from './use-file-view';

export const FileView = () => {
  const {
    inputRef,
    patternInput,
    setPatternInput,
    sortedPatterns,
    patternCounts,
    extensionList,
    subfolderList,
    selectedIndex,
    handleToggle,
    handleToggleSubfolder,
    handlePatternKeyDown,
    handleRemovePattern,
    handleAddPattern,
  } = useFileView();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Filename pattern search section */}
      <div className="relative shrink-0 border-b border-slate-200 bg-slate-50 px-2 py-2 dark:border-slate-700 dark:bg-slate-800">
        <input
          type="text"
          ref={inputRef}
          value={patternInput}
          onChange={(e) => setPatternInput(e.target.value)}
          onKeyDown={handlePatternKeyDown}
          autoFocus
          placeholder="Search file and folder names..."
          className="w-full rounded border border-slate-300 bg-white py-1.5 ps-2 pe-8 text-sm placeholder-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:placeholder-slate-400 dark:focus:border-blue-400"
        />
        <button
          type="button"
          onClick={handleAddPattern}
          disabled={!patternInput.trim()}
          className={`absolute top-3.5 right-4 h-5 w-5 rounded-full p-0.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${
            patternInput.trim()
              ? 'cursor-pointer text-slate-600 hover:bg-blue-500 hover:text-white dark:text-slate-300 dark:hover:bg-blue-400'
              : 'pointer-events-none text-slate-300 dark:text-slate-600'
          }`}
          title="Add pattern"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Filename patterns list */}
        {/* Divider with label */}
        <div className="flex cursor-default items-center gap-2 py-1.5">
          <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-slate-800" />
          <span className="flex items-center gap-1 text-xs text-slate-400 text-shadow-white text-shadow-xs dark:text-shadow-slate-900">
            <FileSearchIcon className="h-4 w-4" />
            Name Search
          </span>
          <span className="h-px flex-1 bg-slate-200 shadow-2xs shadow-white dark:bg-slate-500 dark:shadow-stone-800" />
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-700">
          {sortedPatterns.length > 0 ? (
            sortedPatterns.map((pattern) => (
              <li
                key={pattern}
                className="flex cursor-default items-center justify-between bg-slate-100 px-3 py-2 transition-colors dark:bg-slate-800"
              >
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {pattern}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 tabular-nums dark:text-slate-400">
                    {patternCounts[pattern] || 0}
                  </span>
                  <button
                    onClick={(e) => handleRemovePattern(pattern, e)}
                    className="hover:text-blue-80 cursor-pointer rounded-full bg-slate-100 p-0.5 text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-800 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 dark:hover:text-slate-200"
                    title="Remove search"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </span>
              </li>
            ))
          ) : (
            <li className="cursor-default px-3 py-2 text-slate-400">
              No active name searches
            </li>
          )}
        </ul>

        {/* Subfolder list */}
        {subfolderList.length > 0 && (
          <>
            {/* Divider with label */}
            <div className="flex cursor-default items-center gap-2 py-1.5">
              <span className="h-px flex-1 bg-indigo-200 shadow-2xs shadow-white dark:bg-indigo-700 dark:shadow-indigo-950" />
              <span className="flex items-center gap-1 text-xs text-indigo-400 text-shadow-white text-shadow-xs dark:text-shadow-indigo-950">
                <FolderOpenIcon className="h-4 w-4" />
                Repeat Folders
              </span>
              <span className="h-px flex-1 bg-indigo-200 shadow-2xs shadow-white dark:bg-indigo-700 dark:shadow-indigo-950" />
            </div>

            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {subfolderList.map((item, index) => (
                <li
                  id={`subfolder-${item.subfolder}`}
                  key={item.subfolder}
                  onClick={() => handleToggleSubfolder(item.subfolder)}
                  className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                    index === selectedIndex
                      ? item.isActive
                        ? 'bg-indigo-200 dark:bg-indigo-800'
                        : 'bg-blue-100 dark:bg-blue-900/50'
                      : item.isActive
                        ? 'bg-indigo-100 dark:bg-indigo-900'
                        : 'hover:bg-blue-50 dark:hover:bg-slate-700'
                  }`}
                  title={
                    item.isActive
                      ? 'Click to remove from filters'
                      : 'Click to add to filters'
                  }
                >
                  <span
                    className={`text-sm ${
                      item.isActive
                        ? 'font-medium text-indigo-700 dark:text-indigo-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {item.subfolder}
                  </span>
                  <span
                    className={`text-xs tabular-nums ${
                      item.isActive
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Divider with label */}
        <div className="flex cursor-default items-center gap-2 py-1.5">
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white dark:bg-stone-500 dark:shadow-stone-800" />
          <span className="flex items-center gap-1 text-xs text-stone-400 text-shadow-white text-shadow-xs dark:text-shadow-stone-900">
            <FileImageIcon className="h-4 w-4" />
            File Types
          </span>
          <span className="h-px flex-1 bg-stone-200 shadow-2xs shadow-white dark:bg-stone-500 dark:shadow-stone-800" />
        </div>

        {/* Extension list */}
        {extensionList.length === 0 ? (
          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400">
            No file extensions available
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {extensionList.map((item, index) => (
              <li
                id={`tag-${item.ext}`}
                key={item.ext}
                onClick={() => handleToggle(item.ext)}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 transition-colors ${
                  index === selectedIndex
                    ? item.isActive
                      ? 'bg-stone-200 dark:bg-stone-700'
                      : 'bg-blue-100 dark:bg-blue-900/50'
                    : item.isActive
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'hover:bg-blue-50 dark:hover:bg-slate-700'
                }`}
                title={
                  item.isActive
                    ? 'Click to remove from filters'
                    : 'Click to add to filters'
                }
              >
                <span
                  className={`text-sm ${
                    item.isActive
                      ? 'font-medium text-stone-700 dark:text-stone-300'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {item.ext}
                </span>
                <span
                  className={`text-xs tabular-nums ${
                    item.isActive
                      ? 'text-stone-600 dark:text-stone-400'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.count}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
