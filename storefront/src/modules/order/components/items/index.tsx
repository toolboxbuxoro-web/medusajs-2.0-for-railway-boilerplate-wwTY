"use client"

import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@medusajs/ui"

import Divider from "@modules/common/components/divider"
import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  items: HttpTypes.StoreCartLineItem[] | HttpTypes.StoreOrderLineItem[] | null
  orderId?: string
  reviewStatuses?: Record<string, any>
}

const Items = ({ items, orderId, reviewStatuses }: ItemsProps) => {
  return (
    <div className="flex flex-col">
      <Divider className="!mb-0" />
      <Table>
        <Table.Body data-testid="products-table">
          {items?.length
            ? items
                .sort((a, b) => {
                  return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                })
                .map((item) => {
                  return (
                    <Item 
                      key={item.id} 
                      item={item} 
                      orderId={orderId} 
                      reviewStatus={item.product_id ? reviewStatuses?.[item.product_id]?.status : "none"}
                    />
                  )
                })
            : repeat(5).map((i) => {
                return <SkeletonLineItem key={i} />
              })}
        </Table.Body>
      </Table>
    </div>
  )
}

export default Items
