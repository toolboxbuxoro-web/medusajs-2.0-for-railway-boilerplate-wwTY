"use client"

import React from "react"
import { useTranslations } from "next-intl"
import Modal from "@modules/common/components/modal"
import { Button } from "@medusajs/ui"

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading?: boolean
}

const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const t = useTranslations("account")

  return (
    <Modal isOpen={isOpen} close={onClose} size="small">
      <Modal.Title>{t("logout")}</Modal.Title>
      <Modal.Body>
        <div className="space-y-4 pt-4">
          <p className="text-gray-600">
            {t("logout_confirmation") || "Вы уверены, что хотите выйти?"}
          </p>
          
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-gray-700 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-3 text-white font-medium bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" viewBox="0 0 24 24" />
              )}
              {t("logout")}
            </button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default LogoutConfirmModal
