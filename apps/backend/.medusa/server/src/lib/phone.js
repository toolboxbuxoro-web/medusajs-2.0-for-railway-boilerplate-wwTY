"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeUzPhone = normalizeUzPhone;
function normalizeUzPhone(input) {
    if (!input)
        return null;
    // Keep digits only
    const digits = input.replace(/\D/g, "");
    // Accept:
    // - 998XXXXXXXXX (12 digits)
    // - +998XXXXXXXXX (handled above)
    // - 0XXXXXXXXX / XXXXXXXXX (local 9 digits) => assume Uzbekistan, prefix 998
    if (digits.startsWith("998") && digits.length === 12) {
        return digits;
    }
    // Local format (9 digits) e.g. 901234567
    if (digits.length === 9) {
        return `998${digits}`;
    }
    // Local with leading 0 (10 digits) e.g. 0901234567
    if (digits.length === 10 && digits.startsWith("0")) {
        return `998${digits.slice(1)}`;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGhvbmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvbGliL3Bob25lLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNENBd0JDO0FBeEJELFNBQWdCLGdCQUFnQixDQUFDLEtBQWE7SUFDNUMsSUFBSSxDQUFDLEtBQUs7UUFBRSxPQUFPLElBQUksQ0FBQTtJQUN2QixtQkFBbUI7SUFDbkIsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUE7SUFFdkMsVUFBVTtJQUNWLDZCQUE2QjtJQUM3QixrQ0FBa0M7SUFDbEMsNkVBQTZFO0lBQzdFLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLEVBQUUsRUFBRSxDQUFDO1FBQ3JELE9BQU8sTUFBTSxDQUFBO0lBQ2YsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7UUFDeEIsT0FBTyxNQUFNLE1BQU0sRUFBRSxDQUFBO0lBQ3ZCLENBQUM7SUFFRCxtREFBbUQ7SUFDbkQsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxNQUFNLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7UUFDbkQsT0FBTyxNQUFNLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQTtJQUNoQyxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDYixDQUFDIn0=