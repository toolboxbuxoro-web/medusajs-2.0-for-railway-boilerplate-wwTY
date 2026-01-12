/**
 * The key for the InviteUserEmail template, used to identify it
 */
export declare const INVITE_USER = "invite-user";
/**
 * The props for the InviteUserEmail template
 */
export interface InviteUserEmailProps {
    /**
     * The link that the user can click to accept the invitation
     */
    inviteLink: string;
    /**
     * The preview text for the email, appears next to the subject
     * in mail providers like Gmail
     */
    preview?: string;
}
/**
 * Type guard for checking if the data is of type InviteUserEmailProps
 * @param data - The data to check
 */
export declare const isInviteUserData: (data: any) => data is InviteUserEmailProps;
/**
 * The InviteUserEmail template component built with react-email
 */
export declare const InviteUserEmail: {
    ({ inviteLink, preview, }: InviteUserEmailProps): import("react/jsx-runtime").JSX.Element;
    PreviewProps: InviteUserEmailProps;
};
export default InviteUserEmail;
