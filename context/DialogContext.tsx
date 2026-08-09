'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type DialogType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
}

export interface AlertOptions {
  title?: string;
  message: string;
  confirmText?: string;
  type?: DialogType;
}

interface DialogState {
  isOpen: boolean;
  isConfirm: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: DialogType;
  resolve: ((value: boolean) => void) | null;
}

interface DialogContextType {
  confirm: (options: ConfirmOptions | string) => Promise<boolean>;
  showAlert: (options: AlertOptions | string) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>({
    isOpen: false,
    isConfirm: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'danger',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions | string): Promise<boolean> => {
    return new Promise((resolve) => {
      const opts: ConfirmOptions = typeof options === 'string' ? { message: options } : options;
      setDialog({
        isOpen: true,
        isConfirm: true,
        title: opts.title || (opts.type === 'danger' ? 'Confirm Action' : 'Are you sure?'),
        message: opts.message,
        confirmText: opts.confirmText || (opts.type === 'danger' ? 'Delete' : 'Confirm'),
        cancelText: opts.cancelText || 'Cancel',
        type: opts.type || 'danger',
        resolve,
      });
    });
  }, []);

  const showAlert = useCallback((options: AlertOptions | string): Promise<void> => {
    return new Promise((resolve) => {
      const opts: AlertOptions = typeof options === 'string' ? { message: options } : options;
      setDialog({
        isOpen: true,
        isConfirm: false,
        title: opts.title || (opts.type === 'danger' ? 'Error' : opts.type === 'success' ? 'Success' : 'Notice'),
        message: opts.message,
        confirmText: opts.confirmText || 'OK',
        cancelText: '',
        type: opts.type || 'info',
        resolve: () => resolve(),
      });
    });
  }, []);

  const handleClose = (result: boolean) => {
    if (dialog.resolve) {
      dialog.resolve(result);
    }
    setDialog((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialog.isOpen) return;
      if (e.key === 'Escape') {
        handleClose(false);
      } else if (e.key === 'Enter') {
        handleClose(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialog.isOpen]);

  const getIcon = () => {
    switch (dialog.type) {
      case 'danger':
        return <Trash2 style={{ width: 24, height: 24, color: '#dc2626' }} />;
      case 'warning':
        return <AlertTriangle style={{ width: 24, height: 24, color: '#d97706' }} />;
      case 'success':
        return <CheckCircle2 style={{ width: 24, height: 24, color: '#059669' }} />;
      default:
        return <Info style={{ width: 24, height: 24, color: '#0f766e' }} />;
    }
  };

  const value = React.useMemo(() => ({ confirm, showAlert }), [confirm, showAlert]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <AnimatePresence>
        {dialog.isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => handleClose(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#374151')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
              >
                <X size={18} />
              </button>

              <div style={{ padding: '28px 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: dialog.type === 'danger' ? '#fef2f2' : dialog.type === 'warning' ? '#fffbe6' : dialog.type === 'success' ? '#f0fdf4' : '#f0fdfa',
                    border: `1px solid ${dialog.type === 'danger' ? '#fee2e2' : dialog.type === 'warning' ? '#fef3c7' : dialog.type === 'success' ? '#dcfce7' : '#ccfbf1'}`,
                  }}>
                    {getIcon()}
                  </div>

                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#111827',
                      lineHeight: '1.4',
                    }}>
                      {dialog.title}
                    </h3>
                    <p style={{
                      marginTop: '8px',
                      marginBottom: 0,
                      fontSize: '14px',
                      color: '#4b5563',
                      lineHeight: '1.5',
                    }}>
                      {dialog.message}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{
                padding: '16px 24px 20px',
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                backgroundColor: '#fafafa',
                borderTop: '1px solid #f3f4f6',
              }}>
                {dialog.isConfirm && (
                  <button
                    onClick={() => handleClose(false)}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#374151',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                      e.currentTarget.style.borderColor = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  >
                    {dialog.cancelText}
                  </button>
                )}

                <button
                  onClick={() => handleClose(true)}
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#ffffff',
                    background: dialog.type === 'danger'
                      ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)'
                      : dialog.type === 'warning'
                      ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                      : dialog.type === 'success'
                      ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                      : 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: dialog.type === 'danger'
                      ? '0 4px 12px rgba(220, 38, 38, 0.25)'
                      : '0 4px 12px rgba(15, 118, 110, 0.25)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '0.92';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within a DialogProvider');
  }
  return context.confirm;
}

export function useAlert() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useAlert must be used within a DialogProvider');
  }
  return context.showAlert;
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
