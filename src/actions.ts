'use server'

import OpenAI from "openai";
import bufferToDataUrl from "buffer-to-data-url"
import {Uploadable} from "openai/uploads";
import { getAuth, getAccessControl } from "@kobbleio/next/server";
import { getKobbleAdmin } from "@/lib/kobble-admin";

const openai = new OpenAI();

const waitForRunCompleted = async (threadId: string, runId: string) => {
    return new Promise((resolve, reject) => {

        let interval: ReturnType<typeof setInterval> | null = null;

        interval = setInterval(async () => {
            const run = await openai.beta.threads.runs.retrieve(threadId, runId);

            if (run.status === 'completed') {
                if (interval) {
                    clearInterval(interval);
                }
                resolve(run);
            }
        }, 2000);
    });
}

const persistThread = async (params: {
    threadId: string,
    assistantId: string,
    userId: string
}) => {
    const kobbleAdmin = await getKobbleAdmin();

    await kobbleAdmin.users.updateMetadata(params.userId, {
        threadId: params.threadId,
        assistantId: params.assistantId,
    });
}

const sendAudioForUnauthenticatedUsers = async (transcript: string) => {
    const assistant = await openai.beta.assistants.create({
        name: "English teacher",
        instructions: "You're an english assistant teacher, you're here to help your student to improve their speech in english. However, the student is not authenticated yet. You can't help them at all if they don't authenticate. You always respond kindly, you can answer if they ask 'how are you', you can also say 'nice to meet you' with the name of the user. BUT ALWAYS EXPLAIN THAT THE USER HAS TO AUTHENTICATE WITH THE BUTTON BELOW. Always answer that, never help the user with anything.",
        model: "gpt-4o",
    });

    const thread = await openai.beta.threads.create();

    openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: transcript,
    })

    const threadId = thread.id;

    const run = await openai.beta.threads.runs.create(threadId, {
        model: "gpt-4o",
        assistant_id: assistant.id,
    })

    await waitForRunCompleted(threadId, run.id);

    const messages = await openai.beta.threads.messages.list(threadId);

    // @ts-ignore
    const response = messages.data[0].content[0].text.value;

    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: response,
    });

    const arraybuffer = await mp3.arrayBuffer();

    const buffer = Buffer.from(arraybuffer);

    return {
        isError: false,
        dataUrl: await bufferToDataUrl('audio/mpeg', buffer),
        needsAuthentication: true,
    } as const;
}

export const sendAudio = async (formData: FormData): Promise<
    {
        isError: false,
        dataUrl: string,
        needsAuthentication: boolean,
    } | { isError: true, errorMessage: string }
> => {
    const audioFile = formData.get('audio');

    const transcription = await openai.audio.transcriptions.create({
        file: audioFile as Uploadable,
        model: "whisper-1",
    });

    const { session } = await getAuth();

    if (!session) {
        return sendAudioForUnauthenticatedUsers(transcription.text);
    }

    const userId = session.user.id;

    const kobbleAdmin = await getKobbleAdmin();
    const userWithMetadata = await kobbleAdmin.users.getById(userId, { includeMetadata: true });

    let threadInfo = {
        threadId: userWithMetadata.metadata?.threadId ?? null,
        assistantId: userWithMetadata.metadata?.assistantId ?? null,
        userId: userWithMetadata.id,
    }

    const { hasRemainingQuota } = await getAccessControl();

    const hasPermission = await kobbleAdmin.users.hasRemainingQuota(userId, 'messages');

    if (!hasPermission) {
        return {
            isError: true,
            errorMessage: 'You have reached your message quota. Please upgrade your plan to generate more audio.'
        }
    }

    if (!threadInfo.threadId || !threadInfo.assistantId) {
        const assistant = await openai.beta.assistants.create({
            name: "English teacher",
            instructions: "You're an english assistant teacher and your mission is to help the user to improve their speech. The user will upload a series of audio files and our system will transcribe them. After that, we will send you the transcriptions so you can process it and answer to the user. As an AI teacher, you must drive the conversation. You will follow a simple pattern: ask for a simple question, get the answer, and then if needed you will give a feedback or offer a way to improve the user's answer. Repeat infinitely and act kindly to congrats and motivate your student.",
            model: "gpt-4o",
        });

        const thread = await openai.beta.threads.create();

        await persistThread({
            threadId: thread.id,
            assistantId: assistant.id,
            userId: userId
        })

        threadInfo = {
            threadId: thread.id,
            assistantId: assistant.id,
            userId: userId
        }
    }

    openai.beta.threads.messages.create(threadInfo.threadId, {
        role: 'user',
        content: transcription.text,
    })

    const run = await openai.beta.threads.runs.create(threadInfo.threadId, {
        model: "gpt-4o",
        assistant_id: threadInfo.assistantId,
    })

    await waitForRunCompleted(threadInfo.threadId, run.id);

    const messages = await openai.beta.threads.messages.list(threadInfo.threadId);

    // @ts-ignore
    const response = messages.data[0].content[0].text.value;

    const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: response,
    });

    const arraybuffer = await mp3.arrayBuffer();

    const buffer = Buffer.from(arraybuffer);

    await kobbleAdmin.users.incrementQuotaUsage(userId, 'messages');

    return {
        isError: false,
        dataUrl: await bufferToDataUrl('audio/mpeg', buffer),
        needsAuthentication: false,
    };
}