"use client"

import React from "react"
import Modal from "@modules/common/components/modal"
import LoginOtp from "@modules/account/components/login-otp"

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  return (
    <Modal isOpen={isOpen} close={onClose} size="small">
      <Modal.Body>
        <div className="w-full py-4">
          <LoginOtp onSuccess={onSuccess} />
        </div>
      </Modal.Body>
    </Modal>
  )
}

export default AuthModal
