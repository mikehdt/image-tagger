import { FolderIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Image from 'next/image';
import { memo, useState } from 'react';

type ProjectIconProps = {
  project: {
    name: string;
    title?: string;
    thumbnail?: string;
    featured?: boolean;
  };
  onToggleFeatured: (projectName: string, currentFeatured: boolean) => void;
};

const ProjectIconComponent = ({
  project,
  onToggleFeatured,
}: ProjectIconProps) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFeatured(project.name, project.featured || false);
  };

  return (
    <span
      className="relative mr-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white transition-colors"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Regular content (thumbnail or folder icon) */}
      <div
        className={`transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`}
      >
        {project.thumbnail ? (
          <Image
            src={`/projects/${project.thumbnail}`}
            alt={project.title || project.name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <FolderIcon className="h-5 w-5 text-slate-500" />
        )}
      </div>

      {/* Star overlay on hover */}
      <button
        onClick={handleStarClick}
        className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full transition-opacity duration-200 hover:bg-white ${
          isHovering ? 'border border-slate-300 opacity-100' : 'opacity-0'
        }`}
        title={project.featured ? 'Remove from featured' : 'Add to featured'}
      >
        {project.featured ? (
          <StarIconSolid className="h-5 w-5 text-amber-500" />
        ) : (
          <StarIcon className="h-5 w-5 text-slate-600" />
        )}
      </button>
    </span>
  );
};

export const ProjectIcon = memo(ProjectIconComponent);
