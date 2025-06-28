'use client';

import { useState } from 'react';

import { Modal } from './modal';

/**
 * Example usage of the Modal component
 */
export const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <div>
      <button
        onClick={openModal}
        className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
      >
        Open Modal
      </button>

      <Modal isOpen={isOpen} onClose={closeModal}>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Modal Title</h2>
          <p>
            This is an example modal. You can put any content here - text,
            forms, images, etc.
          </p>
          <div className="pt-4">
            <button
              onClick={closeModal}
              className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
