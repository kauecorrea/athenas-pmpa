import React from 'react';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  isOpen,
  title = 'Excluir Item',
  message = 'Tem certeza que deseja excluir permanentemente este registro?',
  onConfirm,
  onCancel,
  confirmText = 'Excluir',
  cancelText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#111827] border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          {message}
        </p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-bold text-white border border-gray-700 hover:bg-gray-800 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-bold text-white bg-red-800/90 hover:bg-red-700 rounded-lg transition-colors shadow-lg shadow-red-900/50"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;
