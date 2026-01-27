import { ExecArgs } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export default async function checkAdmin({ container }: ExecArgs) {
  const userModuleService = container.resolve(Modules.USER);
  const logger = container.resolve("logger");

  console.log("Checking for users in the database...");

  const users = await userModuleService.listUsers({});
  
  if (users.length === 0) {
    logger.warn("No users found in the database.");
  } else {
    logger.info(`Found ${users.length} users:`);
    users.forEach((u) => {
      logger.info(`- ${u.email} (ID: ${u.id}) - Name: ${u.first_name} ${u.last_name}`);
    });
  }
}
