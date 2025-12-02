import { Checkbox, Label } from "@medusajs/ui"
import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  'data-testid'?: string
}

const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  'data-testid': dataTestId
}) => {
  return (
    <div className="flex items-center space-x-3">
      <input
        type="checkbox"
        id="checkbox"
        checked={checked}
        onChange={onChange}
        name={name}
        data-testid={dataTestId}
        className="checkout-checkbox"
      />
      <Label
        htmlFor="checkbox"
        className="text-base font-medium text-gray-700 cursor-pointer select-none"
        size="large"
      >
        {label}
      </Label>
    </div>
  )
}

export default CheckboxWithLabel
