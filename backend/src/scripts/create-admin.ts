import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { createUsersWorkflow } from "@medusajs/medusa/core-flows";

export default async function createAdmin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModuleService = container.resolve(Modules.USER);

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
    
    const { result } = await createUsersWorkflow(container).run({
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
      } else {
        logger.warn("⚠️ User created but could not be verified");
      }
    } else {
      logger.error("Failed to create admin user - no result returned");
    }
  } catch (error: any) {
    logger.error("Error creating admin user:", error.message);
    logger.error("Stack:", error.stack);
    throw error;
  }
}

