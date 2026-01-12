"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderPlacedTemplate = exports.isOrderPlacedTemplateData = exports.ORDER_PLACED = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const base_1 = require("./base");
exports.ORDER_PLACED = 'order-placed';
const isOrderPlacedTemplateData = (data) => typeof data.order === 'object' && typeof data.shippingAddress === 'object';
exports.isOrderPlacedTemplateData = isOrderPlacedTemplateData;
const OrderPlacedTemplate = ({ order, shippingAddress, preview = 'Your order has been placed!' }) => {
    return ((0, jsx_runtime_1.jsx)(base_1.Base, { preview: preview, children: (0, jsx_runtime_1.jsxs)(components_1.Section, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: '24px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 30px' }, children: "Order Confirmation" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { margin: '0 0 15px' }, children: ["Dear ", shippingAddress.first_name, " ", shippingAddress.last_name, ","] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { margin: '0 0 30px' }, children: "Thank you for your recent order! Here are your order details:" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }, children: "Order Summary" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { margin: '0 0 5px' }, children: ["Order ID: ", order.display_id] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { margin: '0 0 5px' }, children: ["Order Date: ", new Date(order.created_at).toLocaleDateString()] }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { margin: '0 0 20px' }, children: ["Total: ", order.summary.raw_current_order_total.value, " ", order.currency_code] }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { margin: '20px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px' }, children: "Shipping Address" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { margin: '0 0 5px' }, children: shippingAddress.address_1 }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: { margin: '0 0 5px' }, children: [shippingAddress.city, ", ", shippingAddress.province, " ", shippingAddress.postal_code] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { margin: '0 0 20px' }, children: shippingAddress.country_code }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { margin: '20px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontSize: '18px', fontWeight: 'bold', margin: '0 0 15px' }, children: "Order Items" }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        border: '1px solid #ddd',
                        margin: '10px 0'
                    }, children: [(0, jsx_runtime_1.jsxs)("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                backgroundColor: '#f2f2f2',
                                padding: '8px',
                                borderBottom: '1px solid #ddd'
                            }, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontWeight: 'bold' }, children: "Item" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontWeight: 'bold' }, children: "Quantity" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { fontWeight: 'bold' }, children: "Price" })] }), order.items.map((item) => ((0, jsx_runtime_1.jsxs)("div", { style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '8px',
                                borderBottom: '1px solid #ddd'
                            }, children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { children: [item.title, " - ", item.product_title] }), (0, jsx_runtime_1.jsx)(components_1.Text, { children: item.quantity }), (0, jsx_runtime_1.jsxs)(components_1.Text, { children: [item.unit_price, " ", order.currency_code] })] }, item.id)))] })] }) }));
};
exports.OrderPlacedTemplate = OrderPlacedTemplate;
exports.OrderPlacedTemplate.PreviewProps = {
    order: {
        id: 'test-order-id',
        display_id: 'ORD-123',
        created_at: new Date().toISOString(),
        email: 'test@example.com',
        currency_code: 'USD',
        items: [
            { id: 'item-1', title: 'Item 1', product_title: 'Product 1', quantity: 2, unit_price: 10 },
            { id: 'item-2', title: 'Item 2', product_title: 'Product 2', quantity: 1, unit_price: 25 }
        ],
        shipping_address: {
            first_name: 'Test',
            last_name: 'User',
            address_1: '123 Main St',
            city: 'Anytown',
            province: 'CA',
            postal_code: '12345',
            country_code: 'US'
        },
        summary: { raw_current_order_total: { value: 45 } }
    },
    shippingAddress: {
        first_name: 'Test',
        last_name: 'User',
        address_1: '123 Main St',
        city: 'Anytown',
        province: 'CA',
        postal_code: '12345',
        country_code: 'US'
    }
};
exports.default = exports.OrderPlacedTemplate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3JkZXItcGxhY2VkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21vZHVsZXMvZW1haWwtbm90aWZpY2F0aW9ucy90ZW1wbGF0ZXMvb3JkZXItcGxhY2VkLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0FBQUEsd0RBQTJEO0FBRTNELGlDQUE2QjtBQUdoQixRQUFBLFlBQVksR0FBRyxjQUFjLENBQUE7QUFhbkMsTUFBTSx5QkFBeUIsR0FBRyxDQUFDLElBQVMsRUFBb0MsRUFBRSxDQUN2RixPQUFPLElBQUksQ0FBQyxLQUFLLEtBQUssUUFBUSxJQUFJLE9BQU8sSUFBSSxDQUFDLGVBQWUsS0FBSyxRQUFRLENBQUE7QUFEL0QsUUFBQSx5QkFBeUIsNkJBQ3NDO0FBRXJFLE1BQU0sbUJBQW1CLEdBRTVCLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLE9BQU8sR0FBRyw2QkFBNkIsRUFBRSxFQUFFLEVBQUU7SUFDMUUsT0FBTyxDQUNMLHVCQUFDLFdBQUksSUFBQyxPQUFPLEVBQUUsT0FBTyxZQUNwQix3QkFBQyxvQkFBTyxlQUNOLHVCQUFDLGlCQUFJLElBQUMsS0FBSyxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxtQ0FFdkYsRUFFUCx3QkFBQyxpQkFBSSxJQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsc0JBQzNCLGVBQWUsQ0FBQyxVQUFVLE9BQUcsZUFBZSxDQUFDLFNBQVMsU0FDdkQsRUFFUCx1QkFBQyxpQkFBSSxJQUFDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsOEVBRTVCLEVBRVAsdUJBQUMsaUJBQUksSUFBQyxLQUFLLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxF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