"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteUserEmail = exports.isInviteUserData = exports.INVITE_USER = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const base_1 = require("./base");
/**
 * The key for the InviteUserEmail template, used to identify it
 */
exports.INVITE_USER = 'invite-user';
/**
 * Type guard for checking if the data is of type InviteUserEmailProps
 * @param data - The data to check
 */
const isInviteUserData = (data) => typeof data.inviteLink === 'string' && (typeof data.preview === 'string' || !data.preview);
exports.isInviteUserData = isInviteUserData;
/**
 * The InviteUserEmail template component built with react-email
 */
const InviteUserEmail = ({ inviteLink, preview = `You've been invited to Medusa!`, }) => {
    return ((0, jsx_runtime_1.jsxs)(base_1.Base, { preview: preview, children: [(0, jsx_runtime_1.jsx)(components_1.Section, { className: "mt-[32px]", children: (0, jsx_runtime_1.jsx)(components_1.Img, { src: "https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg", alt: "Medusa", className: "mx-auto w-28" }) }), (0, jsx_runtime_1.jsxs)(components_1.Section, { className: "text-center", children: [(0, jsx_runtime_1.jsxs)(components_1.Text, { className: "text-black text-[14px] leading-[24px]", children: ["You've been invited to be an administrator on ", (0, jsx_runtime_1.jsx)("strong", { children: "Medusa" }), "."] }), (0, jsx_runtime_1.jsx)(components_1.Section, { className: "mt-4 mb-[32px]", children: (0, jsx_runtime_1.jsx)(components_1.Button, { className: "bg-[#000000] rounded text-white text-[12px] font-semibold no-underline px-5 py-3", href: inviteLink, children: "Accept Invitation" }) }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "text-black text-[14px] leading-[24px]", children: "or copy and paste this URL into your browser:" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: {
                            maxWidth: '100%',
                            wordBreak: 'break-all',
                            overflowWrap: 'break-word'
                        }, children: (0, jsx_runtime_1.jsx)(components_1.Link, { href: inviteLink, className: "text-blue-600 no-underline", children: inviteLink }) })] }), (0, jsx_runtime_1.jsx)(components_1.Hr, { className: "border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" }), (0, jsx_runtime_1.jsx)(components_1.Text, { className: "text-[#666666] text-[12px] leading-[24px]", children: "If you were not expecting this invitation, you can ignore this email, as the invitation will expire in 24 hours. If you are concerned about your account's safety, please reply to this email to get in touch with us." })] }));
};
exports.InviteUserEmail = InviteUserEmail;
exports.InviteUserEmail.PreviewProps = {
    inviteLink: 'https://mywebsite.com/app/invite?token=abc123ddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd'
};
exports.default = exports.InviteUserEmail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRlLXVzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbW9kdWxlcy9lbWFpbC1ub3RpZmljYXRpb25zL3RlbXBsYXRlcy9pbnZpdGUtdXNlci50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQUFBLHdEQUE4RTtBQUM5RSxpQ0FBNkI7QUFFN0I7O0dBRUc7QUFDVSxRQUFBLFdBQVcsR0FBRyxhQUFhLENBQUE7QUFpQnhDOzs7R0FHRztBQUNJLE1BQU0sZ0JBQWdCLEdBQUcsQ0FBQyxJQUFTLEVBQWdDLEVBQUUsQ0FDMUUsT0FBTyxJQUFJLENBQUMsVUFBVSxLQUFLLFFBQVEsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLE9BQU8sS0FBSyxRQUFRLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7QUFEL0UsUUFBQSxnQkFBZ0Isb0JBQytEO0FBRTVGOztHQUVHO0FBQ0ksTUFBTSxlQUFlLEdBQUcsQ0FBQyxFQUM5QixVQUFVLEVBQ1YsT0FBTyxHQUFHLGdDQUFnQyxHQUNyQixFQUFFLEVBQUU7SUFDekIsT0FBTyxDQUNMLHdCQUFDLFdBQUksSUFBQyxPQUFPLEVBQUUsT0FBTyxhQUNwQix1QkFBQyxvQkFBTyxJQUFDLFNBQVMsRUFBQyxXQUFXLFlBQzVCLHVCQUFDLGdCQUFHLElBQ0YsR0FBRyxFQUFDLHVHQUF1RyxFQUMzRyxHQUFHLEVBQUMsUUFBUSxFQUNaLFNBQVMsRUFBQyxjQUFjLEdBQ3hCLEdBQ00sRUFDVix3QkFBQyxvQkFBTyxJQUFDLFNBQVMsRUFBQyxhQUFhLGFBQzlCLHdCQUFDLGlCQUFJLElBQUMsU0FBUyxFQUFDLHVDQUF1QywrREFDRix3REFBdUIsU0FDckUsRUFDUCx1QkFBQyxvQkFBTyxJQUFDLFNBQVMsRUFBQyxnQkFBZ0IsWUFDakMsdUJBQUMsbUJBQU0sSUFDTCxTQUFTLEVBQUMsa0ZBQWtGLEVBQzVGLElBQUksRUFBRSxVQUFVLGtDQUdULEdBQ0QsRUFDVix1QkFBQyxpQkFBSSxJQUFDLFNBQVMsRUFBQyx1Q0FBdUMsOERBRWhELEVBQ1AsdUJBQUMsaUJBQUksSUFBQyxLQUFLLEVBQUU7NEJBQ1gsUUFBUSxFQUFFLE1BQU07NEJBQ2hCLFNBQVMsRUFBRSxXQUFXOzRCQUN0QixZQUFZLEVBQUUsWUFBWTt5QkFDM0IsWUFDQyx1QkFBQyxpQkFBSSxJQUNILElBQUksRUFBRSxVQUFVLEVBQ2hCLFNBQVMsRUFBQyw0QkFBNEIsWUFFckMsVUFBVSxHQUNOLEdBQ0YsSUFDQyxFQUNWLHVCQUFDLGVBQUUsSUFBQyxTQUFTLEVBQUMsNERBQTRELEdBQUcsRUFDN0UsdUJBQUMsaUJBQUksSUFBQyxTQUFTLEVBQUMsMkNBQTJDLHVPQUlwRCxJQUNGLENBQ1IsQ0FBQTtBQUNILENBQUMsQ0FBQTtBQWpEWSxRQUFBLGVBQWUsbUJBaUQzQjtBQUVELHVCQUFlLENBQUMsWUFBWSxHQUFHO0lBQzdCLFVBQVUsRUFBRSw0TkFBNE47Q0FDak4sQ0FBQTtBQUV6QixrQkFBZSx1QkFBZSxDQUFBIn0=