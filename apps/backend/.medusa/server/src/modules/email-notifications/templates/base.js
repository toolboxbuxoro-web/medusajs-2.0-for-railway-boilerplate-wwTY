"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Base = ({ preview, children }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsx)(components_1.Head, {}), (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Tailwind, { children: (0, jsx_runtime_1.jsx)(components_1.Body, { className: "bg-white my-auto mx-auto font-sans px-2", children: (0, jsx_runtime_1.jsx)(components_1.Container, { className: "border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] w-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-full break-words", children: children }) }) }) })] }));
};
exports.Base = Base;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tb2R1bGVzL2VtYWlsLW5vdGlmaWNhdGlvbnMvdGVtcGxhdGVzL2Jhc2UudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFBQSx3REFBd0Y7QUFRakYsTUFBTSxJQUFJLEdBQXdCLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsRUFBRTtJQUNqRSxPQUFPLENBQ0wsd0JBQUMsaUJBQUksZUFDSCx1QkFBQyxpQkFBSSxLQUFHLEVBQ1IsdUJBQUMsb0JBQU8sY0FBRSxPQUFPLEdBQVcsRUFDNUIsdUJBQUMscUJBQVEsY0FDUCx1QkFBQyxpQkFBSSxJQUFDLFNBQVMsRUFBQyx5Q0FBeUMsWUFDdkQsdUJBQUMsc0JBQVMsSUFBQyxTQUFTLEVBQUMsOEdBQThHLFlBQ2pJLGdDQUFLLFNBQVMsRUFBQyx3QkFBd0IsWUFDcEMsUUFBUSxHQUNMLEdBQ0ksR0FDUCxHQUNFLElBQ04sQ0FDUixDQUFBO0FBQ0gsQ0FBQyxDQUFBO0FBaEJZLFFBQUEsSUFBSSxRQWdCaEIifQ==