import {
    useAuth,
    useAccessControl,
    LogoutButton,
    PricingLink,
} from "@kobbleio/next/client";
import { FC } from "react";

export const UserInfo: FC = () => {
    const { quotas } = useAccessControl();
    const { user } = useAuth();

    const quota = quotas?.find((quota) => quota.name === "messages");

    return (
        <div className={"text-white space-x-3 text-sm flex items-center justify-center"}>
            <span>{user?.email}</span>
            <span
                className={
                    "p-2 rounded-full border border-teal-800 bg-teal-500/40 text-teal-100"
                }
            >
            Message Credit: {quota?.usage ?? 0} / {quota?.limit ?? 0}
            </span>
            {
                quota?.remaining === 0 && (
                    <PricingLink>
                        <span
                            className={
                                "rounded-md bg-red-800 hover:bg-red-600 text-red-100 py-1 px-3 flex gap-2"
                            }
                        >
                            Upgrade
                        </span>
                    </PricingLink>
                )
            }
            <LogoutButton>Logout</LogoutButton>
        </div>
    );
};
