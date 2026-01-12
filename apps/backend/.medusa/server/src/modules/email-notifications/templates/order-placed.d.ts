import * as React from 'react';
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types';
export declare const ORDER_PLACED = "order-placed";
interface OrderPlacedPreviewProps {
    order: OrderDTO & {
        display_id: string;
        summary: {
            raw_current_order_total: {
                value: number;
            };
        };
    };
    shippingAddress: OrderAddressDTO;
}
export interface OrderPlacedTemplateProps {
    order: OrderDTO & {
        display_id: string;
        summary: {
            raw_current_order_total: {
                value: number;
            };
        };
    };
    shippingAddress: OrderAddressDTO;
    preview?: string;
}
export declare const isOrderPlacedTemplateData: (data: any) => data is OrderPlacedTemplateProps;
export declare const OrderPlacedTemplate: React.FC<OrderPlacedTemplateProps> & {
    PreviewProps: OrderPlacedPreviewProps;
};
export default OrderPlacedTemplate;
