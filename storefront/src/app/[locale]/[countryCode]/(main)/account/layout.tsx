import { getCustomer } from "@lib/data/customer"
import AccountLayout from "@modules/account/templates/account-layout"
import { AuthProvider } from "@lib/context/auth-context"
import AccountGatedWrapper from "@modules/account/components/account-gated-wrapper"

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await getCustomer().catch(() => null)

  return (
    <AuthProvider initialCustomer={customer}>
      <AccountLayout>
        <AccountGatedWrapper dashboard={dashboard} login={login} />
      </AccountLayout>
    </AuthProvider>
  )
}
