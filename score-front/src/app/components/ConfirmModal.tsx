import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed text-sm inset-0 bg-black/70 bg-opacity-10 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full rtl vazirmatn">
        <h2 className=" font-bold mb-4 text-right">{title}</h2>
        <p className="text-gray-700 mb-6 text-right ">{message}</p>
        <div className="flex justify-end gap-3 text-xs">
          <button
            onClick={onConfirm}
            className="bg-blue-600   cursor-pointer hover:bg-blue-700 text-white  py-2 px-4 rounded transition-colors duration-200"
          >
            بله، ثبت کن
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400  cursor-pointer hover:bg-gray-500 text-white  py-2 px-4 rounded transition-colors duration-200"
          >
            خیر
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
