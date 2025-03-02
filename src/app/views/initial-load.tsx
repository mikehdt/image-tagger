import { Loader } from '../components/loader';

export const InitialLoad = () => (
  <div className="mx-auto w-1/4 text-center">
    <p>
      <Loader />
    </p>
    <h1 className="mt-4 w-full text-xl">Loading&hellip;</h1>
  </div>
);
