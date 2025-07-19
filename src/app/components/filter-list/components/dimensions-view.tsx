import { useFilterContext } from '../filter-context';
import { BucketsView } from './view-buckets';
import { SizesView } from './view-sizes';

export const DimensionsView = () => {
  const { sizeSubView } = useFilterContext();

  return sizeSubView === 'dimensions' ? <SizesView /> : <BucketsView />;
};
