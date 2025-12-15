import { NextRequest, NextResponse } from 'next/server'
import { sdk } from '@lib/config'

/**
 * API route to check payment status for a cart/order
 * Used by PaymePaymentButton to verify payment after returning from Payme
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const cartId = searchParams.get('cart_id')
  
  if (!cartId) {
    return NextResponse.json(
      { status: 'error', message: 'Missing cart_id' },
      { status: 400 }
    )
  }

  try {
    // First, try to get the order by checking if cart was completed
    // In Medusa 2.0, completed cart creates an order with relationship to the cart
    const orders = await sdk.store.order.list(
      { 
        limit: 1,
        // We need to find order that matches our cart
        // Since order is created from cart, we can filter by metadata or just get recent
      },
      { next: { revalidate: 0 } }
    ).catch(() => ({ orders: [] }))

    // Check if we have an order for this cart by querying the cart
    try {
      const cartResp = await sdk.store.cart.retrieve(cartId, {}, { next: { revalidate: 0 } })
      const cart = cartResp.cart
      
      // If cart has completed_at, it means payment was successful and order was created
      if (cart?.completed_at) {
        // Find the order - typically the order ID will be in a specific location
        // In Medusa 2.0, when cart.complete() is called, it returns the order
        // But here we're checking after the fact, so we need to find it differently
        
        // Return completed status - frontend will need to redirect to account/orders
        // or we can try to find the order ID
        return NextResponse.json({
          status: 'completed',
          completed_at: cart.completed_at,
          message: 'Payment successful, order created'
        })
      }
      
      // Cart exists but not completed - check payment session status
      const paymentSession = cart?.payment_collection?.payment_sessions?.find(
        (s: any) => s.provider_id?.includes('payme')
      )
      
      if (!paymentSession) {
        return NextResponse.json({
          status: 'pending',
          message: 'No payment session found'
        })
      }
      
      const sessionData = paymentSession.data as any
      
      // Check Payme-specific states
      if (sessionData?.payme_state === 2) {
        // Payment was performed but cart wasn't completed yet
        // This means PerformTransaction was called but maybe failed to complete cart
        return NextResponse.json({
          status: 'authorized',
          message: 'Payment authorized, completing order...'
        })
      }
      
      if (sessionData?.payme_state === -1 || sessionData?.payme_state === -2) {
        // Payment was cancelled
        return NextResponse.json({
          status: 'cancelled',
          message: 'Payment was cancelled'
        })
      }
      
      if (paymentSession.status === 'authorized') {
        return NextResponse.json({
          status: 'authorized',
          message: 'Payment authorized'
        })
      }
      
      // Still pending
      return NextResponse.json({
        status: 'pending',
        message: 'Payment pending'
      })
      
    } catch (cartError: any) {
      // Cart not found - might mean it was already completed and converted to order
      // This is actually a success case!
      if (cartError?.message?.includes('not found') || cartError?.status === 404) {
        return NextResponse.json({
          status: 'completed',
          message: 'Cart converted to order'
        })
      }
      throw cartError
    }

  } catch (error: any) {
    console.error('[check-payment] Error:', error)
    return NextResponse.json(
      { status: 'error', message: error.message || 'Failed to check payment status' },
      { status: 500 }
    )
  }
}
