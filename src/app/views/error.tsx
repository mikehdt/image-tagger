import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const Error = () => {
  return (
    <div className="mx-auto w-1/4 text-center">
      <p>
        <ExclamationTriangleIcon />
      </p>
      <h1 className="mt-4 mb-4 w-full text-xl">An I/O error occurred</h1>
    </div>
  );
};
