import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";

export default async function checkAdmin({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const userModuleService = container.resolve(Modules.USER);

  const adminEmail = process.env.MEDUSA_ADMIN_EMAIL || "admin@toolbox.com";

  try {
    logger.info("🔍 Checking admin user...");
    logger.info(`Looking for user with email: ${adminEmail}`);
    
    // Проверяем всех пользователей
    const allUsers = await userModuleService.listUsers({});
    logger.info(`Total users in database: ${allUsers.length}`);
    
    // Ищем пользователя по email
    const users = await userModuleService.listUsers({
      email: adminEmail,
    });

    if (users.length === 0) {
      logger.error(`❌ User with email ${adminEmail} NOT FOUND in database!`);
      logger.info("💡 Solution: Run 'pnpm run create:admin' to create the admin user");
      return;
    }

    const user = users[0];
    logger.info("✅ User found!");
    logger.info(`User ID: ${user.id}`);
    logger.info(`Email: ${user.email}`);
    logger.info(`First Name: ${user.first_name || 'N/A'}`);
    logger.info(`Last Name: ${user.last_name || 'N/A'}`);
    logger.info(`Created At: ${user.created_at}`);
    logger.info(`Updated At: ${user.updated_at}`);
    
    // Проверяем, есть ли у пользователя пароль
    if (user.password_hash) {
      logger.info("✅ Password hash exists");
    } else {
      logger.warn("⚠️ Password hash is missing - user cannot login!");
    }

    logger.info("");
    logger.info("📝 To login:");
    logger.info(`   Email: ${adminEmail}`);
    logger.info(`   Password: ${process.env.MEDUSA_ADMIN_PASSWORD || 'Check MEDUSA_ADMIN_PASSWORD env var'}`);
    
  } catch (error: any) {
    logger.error("Error checking admin user:", error.message);
    logger.error("Stack:", error.stack);
    throw error;
  }
}

