"use client"

import React, { useState, Fragment } from "react"
import { Button, Text, Heading, Badge } from "@medusajs/ui"
import { useTranslations } from "next-intl"
import AddReviewForm from "@modules/products/components/reviews/add-review/form"
import { Dialog, Transition } from "@headlessui/react"
import { XMark } from "@medusajs/icons"

type ReviewButtonProps = {
  productId: string
  reviewStatus?: "none" | "pending" | "approved" | "rejected"
  orderId: string
}

const ReviewButton = ({ productId, reviewStatus = "none", orderId }: ReviewButtonProps) => {
  const t = useTranslations("product")
  const [isOpen, setIsOpen] = useState(false)

  if (reviewStatus === "approved") {
    return (
      <Badge color="green" className="whitespace-nowrap">
        {t("review_sent")}
      </Badge>
    )
  }

  if (reviewStatus === "pending") {
    return (
      <Badge color="orange" className="whitespace-nowrap">
        {t("review_sent_text").split('.')[0]}...
      </Badge>
    )
  }

  if (reviewStatus === "rejected") {
    return (
      <Badge color="red" className="whitespace-nowrap">
        {t("review_status_rejected") || "Отклонён"}
      </Badge>
    )
  }

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        className="w-full sm:w-auto"
        onClick={() => setIsOpen(true)}
      >
        {t("leave_review")}
      </Button>

      <Transition show={isOpen} as={Fragment}>
        <Dialog 
          onClose={() => setIsOpen(false)}
          className="relative z-[100]"
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <Dialog.Title as="h2" className="text-xl font-bold text-gray-900">
                      {t("leave_review")}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Close"
                    >
                      <XMark className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <AddReviewForm 
                      productId={productId} 
                      isLoggedIn={true}
                      onLoginClick={() => {}}
                      onSuccess={() => {
                        setTimeout(() => setIsOpen(false), 2000)
                      }} 
                    />
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ReviewButton
