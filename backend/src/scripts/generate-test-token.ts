import * as jwt from "jsonwebtoken";

const JWT_SECRET = "supersecret";
const customerId = "cus_01KF2NG1AZ612WY8SFQBKQM3S5";
const authIdentityId = "authid_01KF2NG1AEDY23KGNM6ZJ7HBN9";

const token = jwt.sign(
  {
    actor_id: customerId,
    auth_identity_id: authIdentityId,
    actor_type: "customer",
    domain: "store",
  },
  JWT_SECRET,
  { expiresIn: "30d" }
);

console.log("========================================");
console.log("MANUAL JWT TOKEN FOR LOCAL TESTING:");
console.log(token);
console.log("========================================");
console.log("\nINSTRUCTIONS FOR BROWSER:");
console.log("1. Open http://localhost:8000 in your browser");
console.log("2. Open DevTools (F12) -> Console");
console.log(`3. Run this command to set the session:`);
console.log(`   document.cookie = 'medusa_auth_token=${token}; path=/';`);
console.log(`   localStorage.setItem('medusa_auth_token', '${token}');`);
console.log("4. Refresh the page.");
console.log("========================================");
