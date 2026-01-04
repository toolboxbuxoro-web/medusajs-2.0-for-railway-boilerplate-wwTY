import { Disclosure } from "@headlessui/react"
import { Badge, Button, clx } from "@medusajs/ui"
import { useEffect } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

import { useTranslations } from 'next-intl'

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage,
  children,
  'data-testid': dataTestid
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()
  const t = useTranslations('account')
  const tCommon = useTranslations('common')
  const defaultErrorMessage = t('error_occurred')

  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    toggle()
  }

  useEffect(() => {
    if (isSuccess) {
      close()
    }
  }, [isSuccess, close])

  return (
    <div className="text-small-regular" data-testid={dataTestid}>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="uppercase text-ui-fg-base">{label}</span>
          <div className="flex items-center flex-1 basis-0 justify-end gap-x-4">
            {typeof currentInfo === "string" ? (
              <span className="font-semibold" data-testid="current-info">{currentInfo}</span>
            ) : (
              currentInfo
            )}
          </div>
        </div>
        <div>
          <Button
            variant="secondary"
            className="w-[100px] min-h-[25px] py-1"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? t('cancel') : t('edit')}
          </Button>
        </div>
      </div>

      {/* Success state */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            {
              "grid-rows-[1fr] opacity-100": isSuccess,
              "grid-rows-[0fr] opacity-0": !isSuccess,
            }
          )}
          data-testid="success-message"
        >
          <div className="overflow-hidden">
            <Badge className="p-2 my-4" color="green">
              <span>{label} {t('updated_successfully')}</span>
            </Badge>
          </div>
        </Disclosure.Panel>
      </Disclosure>

      {/* Error state  */}
      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            {
              "grid-rows-[1fr] opacity-100": isError,
              "grid-rows-[0fr] opacity-0": !isError,
            }
          )}
          data-testid="error-message"
        >
          <div className="overflow-hidden">
            <Badge className="p-2 my-4" color="red">
              <span>{errorMessage || defaultErrorMessage}</span>
            </Badge>
          </div>
        </Disclosure.Panel>
      </Disclosure>

      <Disclosure>
        <Disclosure.Panel
          static
          className={clx(
            "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
            {
              "grid-rows-[1fr] opacity-100": state,
              "grid-rows-[0fr] opacity-0": !state,
            }
          )}
        >
          <div className="flex flex-col gap-y-2 py-4 overflow-hidden">
            <div>{children}</div>
            <div className="flex items-center justify-end mt-2">
              <Button
                isLoading={pending}
                className="w-full small:max-w-[140px]"
                type="submit"
                data-testid="save-button"
              >
                {t('save_changes')}
              </Button>
            </div>
          </div>
        </Disclosure.Panel>
      </Disclosure>
    </div>
  )
}

export default AccountInfo
