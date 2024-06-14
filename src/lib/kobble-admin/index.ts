'use server'

import { Kobble } from "@kobbleio/admin";

export const getKobbleAdmin = async () => {
    if (!process.env.KOBBLE_SDK_SECRET_KEY) {
        throw new Error(
            "KOBBLE_SDK_SECRET_KEY is not set. Please set it in your environment variables.",
        );
    }

    return new Kobble(process.env.KOBBLE_SDK_SECRET_KEY);
}
