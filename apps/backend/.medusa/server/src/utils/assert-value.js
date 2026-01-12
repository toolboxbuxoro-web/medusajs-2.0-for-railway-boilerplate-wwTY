"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertValue = assertValue;
/**
 * Assert that a value is not undefined. If it is, throw an error with the provided message.
 * @param v - Value to assert
 * @param errorMessage - Error message to throw if value is undefined
 */
function assertValue(v, errorMessage) {
    if (v === undefined) {
        throw new Error(errorMessage);
    }
    return v;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXNzZXJ0LXZhbHVlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL3V0aWxzL2Fzc2VydC12YWx1ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUtBLGtDQVNDO0FBZEQ7Ozs7R0FJRztBQUNILFNBQWdCLFdBQVcsQ0FDekIsQ0FBZ0IsRUFDaEIsWUFBb0I7SUFFcEIsSUFBSSxDQUFDLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTtJQUMvQixDQUFDO0lBRUQsT0FBTyxDQUFDLENBQUE7QUFDVixDQUFDIn0=