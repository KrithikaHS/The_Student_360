// components/ui/dialog.jsx
import { Dialog as HeadlessDialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

// Main Dialog wrapper
export function Dialog({ isOpen, onClose, children, className = "" }) {
  return (
    <Transition show={isOpen} as={Fragment}>
      <HeadlessDialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto"
        onClose={onClose}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <HeadlessDialog.Overlay className="fixed inset-0 bg-black bg-opacity-30" />
          </Transition.Child>

          {/* Centering trick */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div
              className={`inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl ${className}`}
            >
              {children}
            </div>
          </Transition.Child>
        </div>
      </HeadlessDialog>
    </Transition>
  );
}

// Dialog subcomponents
export function DialogHeader({ children, className = "" }) {
  return <div className={`text-lg font-semibold ${className}`}>{children}</div>;
}

export function DialogContent({ children, className = "" }) {
  return <div className={`mt-2 text-sm text-gray-500 ${className}`}>{children}</div>;
}

export function DialogFooter({ children, className = "" }) {
  return <div className={`mt-4 flex justify-end gap-2 ${className}`}>{children}</div>;
}

export function DialogTitle({ children, className = "" }) {
  return (
    <HeadlessDialog.Title className={`text-lg font-semibold ${className}`}>
      {children}
    </HeadlessDialog.Title>
  );
}
