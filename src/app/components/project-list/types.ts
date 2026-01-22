export type ProjectColor =
  | 'slate'
  | 'rose'
  | 'amber'
  | 'teal'
  | 'sky'
  | 'indigo'
  | 'stone';

export type Project = {
  name: string;
  path: string;
  imageCount?: number;
  title?: string;
  color?: ProjectColor;
  thumbnail?: string;
  featured?: boolean;
  hidden?: boolean;
  private?: boolean;
};
