"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POST = void 0;
const sync_moysklad_stock_1 = require("../../../../workflows/sync-moysklad-stock");
const POST = async (req, res) => {
    try {
        const body = req.body;
        const events = body.events || [];
        console.log(`Received MoySklad webhook with ${events.length} events`);
        const promises = events.map(async (event) => {
            // We expect 'code' to be the SKU.
            // If MoySklad sends 'code' in the webhook payload (which it does for some configurations), we use it.
            // Otherwise, we might need to fetch the entity. For now, we rely on 'code'.
            const sku = event.code;
            if (sku) {
                console.log(`Processing stock sync for SKU: ${sku}`);
                try {
                    const { result } = await (0, sync_moysklad_stock_1.syncMoySkladStockWorkflow)(req.scope).run({
                        input: { sku }
                    });
                    console.log(`Sync result for ${sku}:`, result);
                }
                catch (err) {
                    console.error(`Failed to sync stock for SKU ${sku}:`, err);
                }
            }
            else {
                console.warn("Skipping event without SKU (code):", event);
            }
        });
        await Promise.all(promises);
        res.sendStatus(200);
    }
    catch (error) {
        console.error("Error processing MoySklad webhook:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.POST = POST;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvYXBpL2hvb2tzL21veXNrbGFkL3N0b2NrL3JvdXRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1GQUFxRjtBQUU5RSxNQUFNLElBQUksR0FBRyxLQUFLLEVBQUUsR0FBa0IsRUFBRSxHQUFtQixFQUFFLEVBQUU7SUFDcEUsSUFBSSxDQUFDO1FBQ0gsTUFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLElBQVcsQ0FBQTtRQUM1QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQTtRQUVoQyxPQUFPLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxNQUFNLENBQUMsTUFBTSxTQUFTLENBQUMsQ0FBQTtRQUVyRSxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxLQUFVLEVBQUUsRUFBRTtZQUMvQyxrQ0FBa0M7WUFDbEMsc0dBQXNHO1lBQ3RHLDRFQUE0RTtZQUM1RSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFBO1lBRXRCLElBQUksR0FBRyxFQUFFLENBQUM7Z0JBQ1IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsR0FBRyxFQUFFLENBQUMsQ0FBQTtnQkFDcEQsSUFBSSxDQUFDO29CQUNILE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsK0NBQXlCLEVBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQzt3QkFDaEUsS0FBSyxFQUFFLEVBQUUsR0FBRyxFQUFFO3FCQUNmLENBQUMsQ0FBQTtvQkFDRixPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixHQUFHLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQTtnQkFDaEQsQ0FBQztnQkFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO29CQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0NBQWdDLEdBQUcsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1RCxDQUFDO1lBQ0gsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE9BQU8sQ0FBQyxJQUFJLENBQUMsb0NBQW9DLEVBQUUsS0FBSyxDQUFDLENBQUE7WUFDM0QsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFBO1FBRTNCLEdBQUcsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDckIsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDZixPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxFQUFFLEtBQUssQ0FBQyxDQUFBO1FBQzFELEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQTtJQUMxRCxDQUFDO0FBQ0gsQ0FBQyxDQUFBO0FBbkNZLFFBQUEsSUFBSSxRQW1DaEIifQ==