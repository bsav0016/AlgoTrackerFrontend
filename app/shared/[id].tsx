import { useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { setPendingShare } from "@/features/sharing/pendingShare";

/** `algotracker://shared/<id>` (and, once the domain is set up as a universal link, `https://<api>/s/<id>`) lands
 *  here. The id waits until someone is signed in; the home screen then opens the shared strategy. */
export default function SharedLink() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();

    useEffect(() => {
        setPendingShare(id);
        // The login screen goes straight on to the home screen when a session is already saved.
        router.replace("/(screens)/login-screen");
    }, [id, router]);

    return null;
}
