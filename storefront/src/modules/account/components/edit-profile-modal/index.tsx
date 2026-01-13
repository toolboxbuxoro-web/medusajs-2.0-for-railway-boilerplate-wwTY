"use client"

import React, { useState } from "react"
import { HttpTypes } from "@medusajs/types"
import Modal from "@modules/common/components/modal"
import Input from "@modules/common/components/input"
import { Button } from "@medusajs/ui"
import { updateCustomer } from "@lib/data/customer"
import { useAuth } from "@lib/context/auth-context"
import { useTranslations } from "next-intl"

type EditProfileModalProps = {
  customer: HttpTypes.StoreCustomer
  isOpen: boolean
  onClose: () => void
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  customer,
  isOpen,
  onClose,
}) => {
  const t = useTranslations("account")
  const tCheckout = useTranslations("checkout")
  const { refreshSession, setCustomer } = useAuth()
  
  const [firstName, setFirstName] = useState(customer.first_name || "")
  const [lastName, setLastName] = useState(customer.last_name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Optimistic update
      const prevCustomer = customer
      setCustomer({
        ...customer,
        first_name: firstName,
        last_name: lastName,
      })

      await updateCustomer({
        first_name: firstName,
        last_name: lastName,
      })
      await refreshSession()
      onClose()
    } catch (err: any) {
      // Rollback on error
      setCustomer(customer)
      setError(err.message || t("error_occurred"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} close={onClose} size="small">
      <Modal.Title>{t("edit_profile") || "Редактировать профиль"}</Modal.Title>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="w-full space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-y-4">
            <Input
              label={tCheckout("first_name")}
              name="first_name"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="first-name-input"
            />
            <Input
              label={tCheckout("last_name")}
              name="last_name"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="last-name-input"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs py-1">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
            >
              {t("save_changes")}
            </Button>
          </div>
        </form>
      </Modal.Body>
    </Modal>
  )
}

export default EditProfileModal
