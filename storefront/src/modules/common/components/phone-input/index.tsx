import { Label } from "@medusajs/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

type PhoneInputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder" | "onChange"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ name, label, value, onChange, required, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [displayValue, setDisplayValue] = useState("")

    // Function to format raw numbers into mask: +998 (XX) XXX-XX-XX
    const formatPhoneNumber = (digits: string) => {
      // Limit to 9 digits (Uzbek mobile number length) after prefix
      const limited = digits.slice(0, 9)
      
      let formatted = "+998"
      if (limited.length > 0) {
        formatted += " (" + limited.slice(0, 2)
      }
      if (limited.length >= 2) {
        formatted += ") " + limited.slice(2, 5)
      }
      if (limited.length >= 5) {
        formatted += "-" + limited.slice(5, 7)
      }
      if (limited.length >= 7) {
        formatted += "-" + limited.slice(7, 9)
      }
      
      return formatted
    }

    // Initialize display value from prop
    useEffect(() => {
        if (value) {
            const digitsOnly = value.replace(/\D/g, "")
            const suffix = digitsOnly.startsWith("998") ? digitsOnly.slice(3) : digitsOnly
            setDisplayValue(formatPhoneNumber(suffix))
        } else {
            setDisplayValue("+998")
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value
      
      // Extract digits only, but skip the first 3 if they are 998
      let digits = inputVal.replace(/\D/g, "")
      if (digits.startsWith("998")) {
          digits = digits.slice(3)
      }

      const formatted = formatPhoneNumber(digits)
      setDisplayValue(formatted)
      
      // Propagate the unmasked digits (or full E.164) to parent
      // Here we propagate the formatted string as it was done before, 
      // but the setAddresses logic handles cleaning it.
      const syntheticEvent = {
          ...e,
          target: {
              ...e.target,
              name: name,
              value: formatted
          }
      }
      onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>)
    }

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex flex-col w-full">
        <div className="flex relative z-0 w-full txt-compact-medium">
          <input
            ref={inputRef}
            type="tel"
            name={name}
            placeholder=" "
            required={required}
            className="checkout-input pt-4 pb-1 block w-full h-12 px-4 mt-0 tracking-widest font-mono text-lg"
            value={displayValue}
            onChange={handleChange}
            {...props}
          />
          <label
            htmlFor={name}
            onClick={() => inputRef.current?.focus()}
            className="flex items-center justify-center mx-3 px-1 transition-all absolute duration-300 top-3 -z-1 origin-0 text-ui-fg-subtle"
          >
            {label}
            {required && <span className="text-rose-500">*</span>}
          </label>
        </div>
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"

export default PhoneInput
