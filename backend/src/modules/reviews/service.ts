import { MedusaService } from "@medusajs/framework/utils"
import { Review } from "./models/review"

class ReviewsService extends MedusaService({
  Review,
}) {
}

export default ReviewsService
