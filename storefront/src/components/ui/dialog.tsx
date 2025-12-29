import { Dialog, Transition } from "@headlessui/react"
import { Fragment, forwardRef } from "react"

// X Icon Component (inline to avoid external dependency)
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// Dialog Root
const DialogRoot = Dialog

// Dialog Portal (wrapper)
const DialogPortal = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
)

// Dialog Overlay
const DialogOverlay = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <Transition.Child
    as={Fragment}
    enter="ease-out duration-300"
    enterFrom="opacity-0"
    enterTo="opacity-100"
    leave="ease-in duration-200"
    leaveFrom="opacity-100"
    leaveTo="opacity-0"
  >
    <div
      ref={ref}
      className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm ${className || ''}`}
      {...props}
    />
  </Transition.Child>
))
DialogOverlay.displayName = "DialogOverlay"

// Dialog Content
interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ children, className, ...props }, ref) => (
    <Transition.Child
      as={Fragment}
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-95 translate-y-4"
      enterTo="opacity-100 scale-100 translate-y-0"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100 translate-y-0"
      leaveTo="opacity-0 scale-95 translate-y-4"
    >
      <Dialog.Panel
        ref={ref}
        className={`relative z-50 w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-6 ${className || ''}`}
        {...props}
      >
        {children}
      </Dialog.Panel>
    </Transition.Child>
  )
)
DialogContent.displayName = "DialogContent"

// Dialog Header
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className || ''}`}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

// Dialog Footer
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ''}`}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

// Dialog Title
const DialogTitle = forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <Dialog.Title
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

// Dialog Description
const DialogDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <Dialog.Description
    ref={ref}
    className={`text-sm text-gray-500 ${className || ''}`}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

// Dialog Close Button
const DialogClose = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
  >
    <XIcon className="h-5 w-5" />
    <span className="sr-only">Close</span>
  </button>
)

export {
  DialogRoot as Dialog,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
}
