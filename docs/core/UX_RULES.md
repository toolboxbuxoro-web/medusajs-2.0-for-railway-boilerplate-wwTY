# UX Rules

Critical design and interaction guidelines for the Toolbox platform.

## 1. OTP Verification UX
- **Resend Policy**: A "Resend Code" button must only be active after a 60-second cooldown timer.
- **Visual Feedback**:
  - Success of sending is currently indicated via a "Code sent" informational state (overcoming Medusa Error shims).
  - Verification success is highlighted with the "✓" icon or a Green success block.

## 2. Post-Checkout (Order Confirmation)
The confirmation page follows a "Success -> Guidance -> Details" hierarchy.
1. **Rahmat! (Thank you!)**: Clear confirmation headline.
2. **Next Steps Checklist**: Fixed 3-step guide:
   - Order Processing.
   - Contact from Manager.
   - Future tracking in Personal Account.
3. **Account Block (Conditional)**: If a first account was created, a prominent blue card informs the user that their login data was sent via SMS.
4. **Technical Email Hygiene**: Technical addresses (`...@phone.local`) are **HIDDEN** from the user. Only the phone number is displayed with an "SMS sent" icon.

## 3. Global Localization Standards
- **Locales**: Standard RU and UZ.
- **Consistency**: All static labels must reside in `storefront/messages/{ru,uz}.json`.
- **Dynamic Data**: Dates and Currencies must be formatted using the current locale (`ru-RU` or `uz-UZ`) via `Intl` utilities.
- **Priority**: Primary focus on the **Uzbekistan market**.
