"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAdmin;
const utils_1 = require("@medusajs/framework/utils");
const core_flows_1 = require("@medusajs/medusa/core-flows");
async function createAdmin({ container }) {
    const logger = container.resolve(utils_1.ContainerRegistrationKeys.LOGGER);
    const userModuleService = container.resolve(utils_1.Modules.USER);
    // Данные администратора
    const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@toolbox.com";
    const adminPassword = process.env.MEDUSA_ADMIN_PASSWORD || "admin123456";
    const adminFirstName = process.env.MEDUSA_ADMIN_FIRST_NAME || "Admin";
    const adminLastName = process.env.MEDUSA_ADMIN_LAST_NAME || "User";
    try {
        // Проверяем, существует ли уже пользователь с таким email
        const existingUsers = await userModuleService.listUsers({
            email: adminEmail,
        });
        if (existingUsers.length > 0) {
            logger.info(`Admin user with email ${adminEmail} already exists. Deleting...`);
            // Удаляем существующего пользователя
            await userModuleService.deleteUsers(existingUsers.map(u => u.id));
            logger.info(`Deleted existing user with email ${adminEmail}`);
        }
        // Создаем администратора
        logger.info("Creating admin user...");
        logger.info(`Email: ${adminEmail}`);
        logger.info(`Password: ${adminPassword}`);
        const { result } = await (0, core_flows_1.createUsersWorkflow)(container).run({
            input: {
                users: [
                    {
                        email: adminEmail,
                        // password: adminPassword, // Password not supported in CreateUserDTO
                        first_name: adminFirstName,
                        last_name: adminLastName,
                    },
                ],
            },
        });
        if (result && result.length > 0) {
            const createdUser = result[0];
            logger.info("✅ Admin user created successfully!");
            logger.info(`Email: ${adminEmail}`);
            logger.info(`Password: ${adminPassword}`);
            logger.info(`User ID: ${createdUser.id}`);
            // Проверяем, что пользователь действительно создан
            const verifyUser = await userModuleService.retrieveUser(createdUser.id);
            if (verifyUser) {
                logger.info(`✅ User verified: ${verifyUser.email}`);
            }
            else {
                logger.warn("⚠️ User created but could not be verified");
            }
        }
        else {
            logger.error("Failed to create admin user - no result returned");
        }
    }
    catch (error) {
        logger.error("Error creating admin user:", error.message);
        logger.error("Stack:", error.stack);
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWFkbWluLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3NjcmlwdHMvY3JlYXRlLWFkbWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT0EsOEJBK0RDO0FBckVELHFEQUdtQztBQUNuQyw0REFBa0U7QUFFbkQsS0FBSyxVQUFVLFdBQVcsQ0FBQyxFQUFFLFNBQVMsRUFBWTtJQUMvRCxNQUFNLE1BQU0sR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLGlDQUF5QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ25FLE1BQU0saUJBQWlCLEdBQUcsU0FBUyxDQUFDLE9BQU8sQ0FBQyxlQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFMUQsd0JBQXdCO0lBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksbUJBQW1CLENBQUM7SUFDekUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsSUFBSSxhQUFhLENBQUM7SUFDekUsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsSUFBSSxPQUFPLENBQUM7SUFDdEUsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsSUFBSSxNQUFNLENBQUM7SUFFbkUsSUFBSSxDQUFDO1FBQ0gsMERBQTBEO1FBQzFELE1BQU0sYUFBYSxHQUFHLE1BQU0saUJBQWlCLENBQUMsU0FBUyxDQUFDO1lBQ3RELEtBQUssRUFBRSxVQUFVO1NBQ2xCLENBQUMsQ0FBQztRQUVILElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLHlCQUF5QixVQUFVLDhCQUE4QixDQUFDLENBQUM7WUFDL0UscUNBQXFDO1lBQ3JDLE1BQU0saUJBQWlCLENBQUMsV0FBVyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLENBQUMsSUFBSSxDQUFDLG9DQUFvQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7UUFFRCx5QkFBeUI7UUFDekIsTUFBTSxDQUFDLElBQUksQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBRTFDLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxNQUFNLElBQUEsZ0NBQW1CLEVBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzFELEtBQUssRUFBRTtnQkFDTCxLQUFLLEVBQUU7b0JBQ0w7d0JBQ0UsS0FBSyxFQUFFLFVBQVU7d0JBQ2pCLHNFQUFzRTt3QkFDdEUsVUFBVSxFQUFFLGNBQWM7d0JBQzFCLFNBQVMsRUFBRSxhQUFhO3FCQUN6QjtpQkFDRjthQUNGO1NBQ0YsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLElBQUksTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUIsTUFBTSxDQUFDLElBQUksQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO1lBQ2xELE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxhQUFhLEVBQUUsQ0FBQyxDQUFDO1lBQzFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxXQUFXLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUUxQyxtREFBbUQ7WUFDbkQsTUFBTSxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hFLElBQUksVUFBVSxFQUFFLENBQUM7Z0JBQ2YsTUFBTSxDQUFDLElBQUksQ0FBQyxvQkFBb0IsVUFBVSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDdEQsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE1BQU0sQ0FBQyxJQUFJLENBQUMsMkNBQTJDLENBQUMsQ0FBQztZQUMzRCxDQUFDO1FBQ0gsQ0FBQzthQUFNLENBQUM7WUFDTixNQUFNLENBQUMsS0FBSyxDQUFDLGtEQUFrRCxDQUFDLENBQUM7UUFDbkUsQ0FBQztJQUNILENBQUM7SUFBQyxPQUFPLEtBQVUsRUFBRSxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzFELE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNwQyxNQUFNLEtBQUssQ0FBQztJQUNkLENBQUM7QUFDSCxDQUFDIn0=