"use client"

import { HttpTypes } from "@medusajs/types"
import { Table, Text } from "@medusajs/ui"
import { useParams } from "next/navigation"

import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import Thumbnail from "@modules/products/components/thumbnail"
import { getLocalizedLineItemTitle } from "@lib/util/get-localized-line-item"
import ReviewButton from "./review-button"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  orderId?: string
  reviewStatus?: "none" | "pending" | "approved" | "rejected"
}

const Item = ({ item, orderId, reviewStatus = "none" }: ItemProps) => {
  const { locale } = useParams()
  const localeStr = String(locale || "ru")

  return (
    <Table.Row className="w-full" data-testid="product-row">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div className="flex w-16">
          <Thumbnail thumbnail={item.thumbnail} size="square" />
        </div>
      </Table.Cell>

      <Table.Cell className="text-left">
        <div className="flex flex-col gap-y-1">
          <Text
            className="txt-medium-plus text-ui-fg-base"
            data-testid="product-name"
          >
            {getLocalizedLineItemTitle(item, localeStr)}
          </Text>
          {item.variant && (
            <LineItemOptions variant={item.variant} data-testid="product-variant" />
          )}
          {orderId && item.product_id && (
            <div className="mt-2">
              <ReviewButton 
                productId={item.product_id} 
                orderId={orderId} 
                reviewStatus={reviewStatus}
              />
            </div>
          )}
        </div>
      </Table.Cell>

      <Table.Cell className="!pr-0">
        <span className="!pr-0 flex flex-col items-end h-full justify-center">
          <span className="flex gap-x-1 ">
            <Text className="text-ui-fg-muted">
              <span data-testid="product-quantity">{item.quantity}</span>x{" "}
            </Text>
            <LineItemUnitPrice item={item} style="tight" />
          </span>

          <LineItemPrice item={item} style="tight" />
        </span>
      </Table.Cell>
    </Table.Row>
  )
}

export default Item
